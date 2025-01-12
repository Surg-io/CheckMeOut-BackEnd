import express, { Express, Request, response, Response } from "express";
import {ReturnDates, RegNewUser,NewScan,ReturnDevices,RequestReservation} from './sql/database.js'; // tsc creates error, doesnt include .js extension - because of ESM and node shit, just leave it like this with .js
import bodyParser from "body-parser";
import { time } from "console";
import request from 'supertest';
 
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

//------------------Get Requests-------------------

app.get("/", (req: Request, res: Response): void => {
    console.log("Recieved request");
    res.send("Get Method");
});


//------------------Post Requests-------------------
//*Registering Users
//Promise Based Post Request
//When frontend users click register to register to the system. This 
app.post("/registeruser", async (req: Request, res: Response): Promise<void> => { //This function is async as we have a function inside that is accessing a resource. Function returns a void type of promise
    console.log(req.body);
    const response = await RegNewUser("studentuser",req.body.ID,req.body.FN,req.body.LN,req.body.Email,req.body.Major); //Accessing said resource, so we need to wait for a responses
    res.send(response);
});

//*Making a reservation for a device
app.post("/reserve", async (req: Request, res: Response):Promise<void> => 
{// We write the code with the intention that times are blocked between devices(2 Hour Increments, 3 Hour, etc.)
    let reservations = [];
    let status:string;
    let reason:string | number;
    for(let x of req.body) //For every reservation that is sent to us from frontend...
    {
        let response = await RequestReservation("reservations",x.device, x.deviceId,x.time); //...try to add it to the reservations table.
        if(response[0]) //If we don't get an error...
        {
            status = "Success";//...then we have successfully logged the reservations. The status will reflect so.
            reason = response[1];
        }
        else
        {
           status = "Failed";//...else, we failed at logging in the reservation. The status will reflect so.
           reason = response[1];
        }
        reservations.push({"deviceId": x.deviceId, //Add the information of the reservation and its status of completion to an array...
            "device": x.device,
            "time": x.time,
            "status": status,
            "reason": reason});

    }
    console.log(reservations);
    res.send({"Reservations" : reservations}); //...and the array gets send back to frontend.
});

//*Returns the reservations made for a certain date
app.post("/searchdate", async (req: Request,res: Response):Promise<void> => {
    let qreserved: any = await ReturnDevices("reservations",req.body.fullDate); //Get all the data, in order of Device ID;
    let devices = []; 
    let reservedtw = [];
    let previd = {"deviceName": "Dummy", "deviceID" : -1}; //For first check
    for(let x of qreserved) //Go through Data
    {
        if(previd.deviceID == x.deviceID || previd.deviceID == -1)//Add the times and status
        {
            reservedtw.push({"startTime": x.starttime.toLocaleTimeString("en-GB").toString(),"endTime":x.endtime.toLocaleTimeString("en-GB").toString(), "resstatus":x.resstatus});
        }
        else //Upon encountering a new device, append the previous device with array of times, and start a new time array for the current device
        {
            devices.push({"deviceID": `${previd.deviceID}`, "deviceName":`${previd.deviceName}`, "timeWindows": JSON.parse(JSON.stringify(reservedtw))}); //There is only shallow copying in JS, so we need to deep copy
            reservedtw.length = 0;
            reservedtw.push({"startTime": x.starttime.toLocaleTimeString("en-GB").toString(),"endTime":x.endtime.toLocaleTimeString("en-GB").toString(), "resstatus":x.resstatus});
        }
        console.log(reservedtw.length)
        previd = x;
    }
    devices.push({"deviceID": `${previd.deviceID}`, "deviceName":`${previd.deviceName}`, "TimeWindows": reservedtw}); //After the last entry is read, append the last entry along with its array. This doesn't need deep copy as its the most recent one
    let response = {"SelectedDate": `${req.body.year}-${req.body.month}-${req.body.day}`, "Devices": devices};
    res.send(response)
});



//Non-Promise Based Post Request
/*app.post("/registeruser",  (req: Request, res: Response): void => { //This function is async as we have a function inside that is accessing a resource. 
    console.log(req.body);
    console.log(`${req.body.Email}`)

    pool.query(`INSERT INTO studentuser (STUDENTID,FN,LN,EMAIL,MAJOR) VALUES (123456885,"sergio","man","pok@gmail.com","EFG")`,
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
    //console.log(`${Year}-${Month}-${Day}`); //For SQL 
    //console.log(timestamptime); //For SQL
    //console.log(req.body);

    const currentDate = new Date(); //Timestamps when the request comes in, or whenever a code is scanned
    const [Month, Day, Year] = currentDate.toLocaleDateString().split("/"); //Parses the Date from the timestamp obj
    const time:string = currentDate.toLocaleTimeString("en-GB").toString();//Taken in PST. Gets the time
    const response = await NewScan("StudentCheckIns",req.body.ID,time,`${Year}-${Month}-${Day}`); //Passes the ID, time and date in a format acceptable to SQL so query can take place.
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
    

