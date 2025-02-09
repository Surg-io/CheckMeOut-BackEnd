import express, { Express, Request, Response } from "express";
import {ReturnDates, RegNewUser,NewScan,ReturnDevices,RequestReservation, RetreivePassword, checkinhistory, CreateTables} from './sql/database.js'; // tsc creates error, doesnt include .js extension - because of ESM and node shit, just leave it like this with .js
import bodyParser from "body-parser";
import {SanatizeInput, SendEmail,SignToken,ValidateToken} from "./Functions/Functions.js";
import { time } from "console";
import request from 'supertest';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Query } from "mysql2/typings/mysql/lib/protocol/sequences/Query.js";
import { QueryResult } from "mysql2";
dotenv.config();
//import { timeStamp } from "console";
//var time = require("express-timestamp");

//* Represents the start of an endpoint

// ~Express Server Initialization/Method Handling~

const port: Number = Number(process.env.PORT) || 8000; // remove port later in dev
const app: Express = express();

app.use(bodyParser.json()); //.use functions are executed before everything else
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/registeruser",(req, res, next) => { //Function will configure the CORS policy for this API. See CORS policy
    res.setHeader("Access-Control-Allow-Origin", `*`); //Allows Requests from every Origin(Any IP /Frontend)
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT"); //Allows these methods from said Origin
    res.setHeader("Access-Control-Allow-Headers", "Content-Type"); //Allows the modification of these headers to use in our API.Json specifically is a content header
    next(); //Sends control to the next call back function for /registeruser
});

//----------------Initialization for Testing------------------
app.get("/env", (req: Request, res: Response): void => {
    console.log('Secret from .env:', process.env.Secret);
    res.send("Get Env Method");
});

app.get("/", (req: Request, res: Response): void => {
    console.log("Recieved request");
    res.send("Get Method");
});

//*Following few Queries initialize a mysql table for testing..
app.get("/inittables", (req: Request, res: Response): void => {
    CreateTables();
    res.send("Get Method");
});
//-------------------------------------------------------------

//------------------Post Requests-------------------

//*User Sign In
app.post("/login", async (req:Request,res:Response) => 
{
    let {Username, Password} = req.body; //Parse Request
    let QueryResponse: any = await RetreivePassword(Username); //We require this so we can index Query Response Later On...
    let ReturnMessage = {"Success": false, "Message": "Invalid Password or Email"};
    if(QueryResponse instanceof Error) //If Query is an Error
        return res.status(401).send(QueryResponse.message);
    if(!QueryResponse) //If the Query doesn't return anything, then wrong Email
    {
        return res.status(402).send(ReturnMessage);
    }
    else //If we do get a response, compare...
    {
        if(QueryResponse[0].Password === Password) //If passwords match up...
        {
            //Adjust Message to reflect States
            ReturnMessage.Success = true; 
            ReturnMessage.Message = "Login Successful";
            let token = await SignToken(QueryResponse[0].AccountID); //Generate the token
            Object.assign(ReturnMessage, {"Token": token, "ExpiresIn":3600}); //Appends to the previously defined object
            return res.status(200).send(ReturnMessage);
        }
        else //If Passwords don't match, return Error Message
        {
            return res.status(402).send(ReturnMessage);
        }
    }
});


//*Registering Users
app.post("/RegisterUser", async (req: Request, res: Response): Promise<void> => { //This function is async as we have a function inside that is accessing a resource. Function returns a void type of promise
    console.log(req.body);
    //console.log(SanatizeInput(req.body.FN,'N') , SanatizeInput(req.body.LN,'N') , SanatizeInput(req.body.Email,'E') ,SanatizeInput(req.body.Password, 'P'));
    if (!(SanatizeInput(req.body.FN,'N') && SanatizeInput(req.body.LN,'N') && SanatizeInput(req.body.Email,'E') && SanatizeInput(req.body.Password, 'P')))
    {
        res.status(401).send(`Input doesn't match specified requirements...`);
    }
    else
    {
        let AccountID = req.body.FN[0] + req.body.LN[0] + Math.random().toString().substring(2,8) + req.body.Password.substring(2,5);
        let response: Error | any = await RegNewUser(`Students`,AccountID,req.body.FN,req.body.LN,new Date(req.body.DOB).toISOString().slice(0, 19).replace("T", " "),req.body.Email,req.body.Major,req.body.Password,req.body.StudentID); //Accessing said resource, so we need to wait for a responses
        if(response instanceof Error)
        {
            res.status(401).send(response.message); //Sends the Error
        }
        else
        {
            response = await SendEmail(req.body.FN, req.body.Email.toString());
            if(response instanceof Error)
            {
                res.status(401).send(response.message); //Sends the Error
            }
            else
            {
                const token = SignToken(AccountID);
                res.status(200).send(response);
            }
        }
    }
});

//*Making a reservation for a device
app.post("/Reserve", async (req: Request, res: Response):Promise<void> => 
{// We write the code with the intention that times are blocked between devices(2 Hour Increments, 3 Hour, etc.)
    let reservations = [];
    let status:string;
    let reason:string | number;
    let index: number = 0;
    let badreservations = [];
    for(let x of req.body) //For every reservation that is sent to us from frontend...
    {
        let response = await RequestReservation("Reservations",x.device, x.DeviceID,x.time); //...try to add it to the reservations table.
        if(response[0]) //If we don't get an error...
        {
            status = "Success";//...then we have successfully logged the reservations. The status will reflect so.
            reason = response[1];
        }
        else
        {
           status = "Failed";//...else, we failed at logging in the reservation. The status will reflect so.
           reason = response[1];
           badreservations.push(index);
        }
        reservations.push({"DeviceID": x.DeviceID, //Add the information of the reservation and its status of completion to an array...
            "device": x.device,
            "time": x.time,
            "status": status,
            "reason": reason});
        index += 1;
    }
    console.log(reservations);
    res.send({"Reservations" : reservations,  "ErrorIndicies": badreservations}); //...and the array gets send back to frontend.
});

//*Returns the reservations made for a certain date
app.post("/Searchdate", async (req: Request,res: Response):Promise<void> => {
    let qreserved: any = await ReturnDevices("Reservations",req.body.fullDate); //Get all the data, in order of Device ID;
    let devices = []; 
    let reservedtw = [];
    let previd = {"DeviceName": "Dummy", "DeviceID" : -1}; //For first check
    for(let x of qreserved) //Go through Data
    {
        if(previd.DeviceID == x.DeviceID || previd.DeviceID == -1)//Add the times and status
        {
            reservedtw.push({"startTime": x.starttime.toLocaleTimeString("en-GB").toString(),"endTime":x.endtime.toLocaleTimeString("en-GB").toString(), "ResStatus":x.ResStatus});
        }
        else //Upon encountering a new device, append the previous device with array of times, and start a new time array for the current device
        {
            devices.push({"DeviceID": `${previd.DeviceID}`, "DeviceName":`${previd.DeviceName}`, "TimeWindows": JSON.parse(JSON.stringify(reservedtw))}); //There is only shallow copying in JS, so we need to deep copy
            reservedtw.length = 0;
            reservedtw.push({"StartTime": x.starttime.toLocaleTimeString("en-GB").toString(),"EndTime":x.endtime.toLocaleTimeString("en-GB").toString(), "ResStatus":x.ResStatus});
        }
        console.log(reservedtw.length)
        previd = x;
    }
    devices.push({"DeviceID": `${previd.DeviceID}`, "DeviceName":`${previd.DeviceName}`, "TimeWindows": reservedtw}); //After the last entry is read, append the last entry along with its array. This doesn't need deep copy as its the most recent one
    let response = {"SelectedDate": `${req.body.year}-${req.body.month}-${req.body.day}`, "Devices": devices};
    res.send(response)
});

//*Return the CheckIn's
app.post("/ScanHistory", async (req:Request, res: Response): Promise<void> => //We will build the query based on conditionals
{

    let query = `select * from ScanHistory where StartTime between '${new Date(req.body.startdate).toISOString()}' and '${new Date(req.body.enddate).toISOString()}'` //We wrap the input dates for protection...
    if(req.body.ID)
    {
        query += ` and ID = ${req.body.ID}`
    }
    query += ' Order by checkin';
    console.log(query);
    let history = await checkinhistory(query); res.send(history);
    //res.sendStatus(200);

});
//Non-Promise Based Post Request
/*app.post("/registeruser",  (req: Request, res: Response): void => { //This function is async as we have a function inside that is accessing a resource. 
    console.log(req.body);    console.log(`${req.body.Email}`)

    pool.query(`INSERT INTO studentuser (AccountID,FN,LN,EMAIL,MAJOR) VALUES (123456885,"sergio","man","pok@gmail.com","EFG")`,
        (err) => {if (err)
        {
            return res.send(err);
        }
        res.send("Post Request Successful"); //This gets put into the callback for pool.query as pool.query is async, so if we had it outside, we would've sent a response when the query isn't finished
        //This is problematic as if we did hit an error and we wanted to send said error through res.send(err), we couldn't as we had already sent this response. 
        }); 
    
       // res.send("Post Request Successful");
});*/

//*Timestamping requests for CheckIn
app.post("/scan", async (req:Request,res:Response): Promise<void> => 
{
    const currentDate = new Date().toISOString(); //Timestamps when the request comes in, or whenever a code is scanned
    const response = await NewScan("ScanIn",req.body.ID, currentDate); //Passes the ID, time and date in a format acceptable to SQL so query can take place.
    res.send("Scan Executed");
});





app.listen(port, (): void => {
    console.log(`listening on port ${port}`);
});

//---------------Tests-------------------
/*
request(app) //Tests this "app", which is the exported instance of the server
    .get('/') //Uses the .get() method with the given route
    .end(function(err,res) {if(err)throw err; else console.log(res.body);}); //Callback function executed when a reponse is received. 
*/

   

    

//---------------Null Code---------------
//In case we do account based...?(Put Statement)
/*
// register route, does it need any info? or will use the request body
app.put("/", async (req: Request, res: Response): Promise<void> => {

    // talk to mysql database and update the database
    // rerq body should give me the few items from the form

    const {first_name,last_name,email,major,student_id,} = req.body;
    // let first_name: String = req.params.first_name;
    // let last_name: String = req.params.last_name;
    // let email: String = req.params.email;
    // let major: String = req.params.major;
    // let student_id: String = req.params.id;
    console.log(first_name);
    let number_id = Number(student_id);
    if (isNaN(number_id)) {
        res.status(200).send('Success!'); 
        const user_id = await GetUserId(first_name, last_name, major, student_id)
        // handle error, or output from databas search.
    }
    else {
        res.status(400).send('Failure, bad id sent!');
    }

    res.status(400).send('bad request');
    res.status(404).send('not found');    
});
*/
    

