import express, { Express, query, Request, Response } from "express";
import {ReturnDates,RollbackTransaction, StartTranaction, CommitTransaction, CreateDevice,GetReports, SubmitReport, GetTableRows, CancelReservation,CountCheckIns, RegNewUser,NewScan,ReturnDevices,RequestReservation, RetreivePassword, checkinhistory, CreateTables, CountUsers, getPeakTime, getNumReservations, SendVerificationEmail,ValidateVerificationCode,GetQRCode, getCurrentReservations, GetDevices} from './sql/database.js'; // tsc creates error, doesnt include .js extension - because of ESM and node shit, just leave it like this with .js
import bodyParser from "body-parser";
import {calculateTotal, SanatizeInput, SendEmail,SetPermissions, SignToken,ValidateToken} from "./Functions/Functions.js";
import { time } from "console";
import request from 'supertest';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Query } from "mysql2/typings/mysql/lib/protocol/sequences/Query.js";
import { QueryResult } from "mysql2";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Sign } from "crypto";
import { validateHeaderName } from "http";
import { stat } from "fs";
import { parseArgs } from "util";
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
app.get("/inittables", async (req: Request, res: Response) => {
    //await CreateDB();
    await CreateTables();
    res.send("Get Method");
});

app.get("/testtables", async (req: Request, res: Response) => {
    let rows:any = await GetTableRows();
    if(rows instanceof Error)
    {
        return res.status(500).send(rows.message);
    }
    return res.send(rows);
});

app.get("/testtoken", async (req: Request, res: Response) => {
    let payload = {"load":123}
    return res.send({"token": (await SignToken(payload,'1h')).toLocaleLowerCase().substring(0,30)});
});

app.get("/gettime", async (req: Request, res: Response) => {
    let sstime = new Date(); 
    let timeelapsed = 30; //Number of Hours a reservation slot is...
    console.log(sstime.toLocaleString('en-US'));
    let change = Number(sstime.getMinutes()+ timeelapsed);
    sstime.setMinutes(change);
    console.log(sstime.toLocaleString('en-US'));
    return res.send("Time");
});

//-------------------------------------------------------------
app.get("/api/qrcode",ValidateToken, async (req:Request,res:Response) => 
{
    let AccountID = req.body.userId; //User can only get a token if the email is exists in the system. This is the only source of error
    let QueryResponse:any = await GetQRCode(AccountID);
    if(QueryResponse instanceof Error)
    {
        return res.status(500).send({"success": false, "message": QueryResponse.message, "qrcode":"Error"});
    }
    else
    {
        console.log(QueryResponse);
        return res.status(200).send({"success": true, "message": "QRcode Retreived!", "qrcode":QueryResponse});
    }
});

app.get("/api/stats",ValidateToken, SetPermissions, async (req:Request,res:Response) =>
{
    let pday;
    let pweek;
    let pmonth;
    let p6month;
    let data = {};
    if(req.body.admin)//If Admin Makes request...
    {
        try{
            pday = await CountUsers(24);
            pweek = await CountUsers(7);
            pmonth = await CountUsers(30);
            p6month = await CountUsers(100);
        }catch(err)
        {
            res.status(500).send({"Success": false, "Message": "Error in Returning Number of Users" + err })
        }
        Object.assign(data,{"newUsers": {"past24h": pday,"past7d": pweek,"past30d": pmonth,"past6m": p6month}});
        try {
            // Get reservations for each time range
             pday = await getNumReservations(1);
             pweek = await getNumReservations(7);
             pmonth = await getNumReservations(30);
             p6month = await getNumReservations(180);
          } catch (err) {
            res.status(500).send({"Success": false, "Message": "Error in Returning Reservations of Users" + err });
          }
          Object.assign(data,{"reservationsMade": {
            past24h: {
              devices: pday,
              total: calculateTotal(pday),
            },
            past7d: {
              devices: pweek,
              total: calculateTotal(pweek),
            },
            past30d: {
              devices: pmonth,
              total: calculateTotal(pmonth),
            },
            past6m: {
              devices: p6month,
              total: calculateTotal(p6month),
            },
          }});
          try {
            // Get reservations for each time range
             pday = await CountCheckIns(1);
             pweek = await CountCheckIns(7);
             pmonth = await CountCheckIns(30);
             p6month = await CountCheckIns(180);
          } catch (err) {
            res.status(500).send({"Success": false, "Message": "Error in Returning Number of Users" + err });
          }
          Object.assign(data,{"checkinsMade": {"past24h": pday,"past7d": pweek,"past30d": pmonth,"past6m": p6month}});
          try {
            pday = await getPeakTime(24);
            pweek = await getPeakTime(7 * 24);
          } catch (error) {
            console.error('Error fetching peak time:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
          Object.assign(data,{"peakTime": {"past24h": pday,"past7d":pweek}});
          return res.status(200).json(data);
    }
    
});

app.get("/api/user-reservations",ValidateToken, SetPermissions, async (req:Request, res:Response) => 
{
    let query = 'Select * from Reservations';
    if(!req.body.admin) //If Admin isn't calling....
    {   
        query += `WHERE AccountID = ${req.body.userId}`;
    }
    let rows:any = await getCurrentReservations(query);
    if(rows instanceof Error)
    {
        return res.status(500).send({"success": false, "message": "Error in returning Reservations: " + rows.message});
    }
    return res.status(200).send({"success": true, "message": "Success in returning rows!", "Reservations": rows });
});

//Return All the Reports in a 3 Month Period...
app.get("/api/get-reports", ValidateToken, SetPermissions,  async (req:Request,res:Response) => //ValidateToken, SetPermissions, removed for testing...
{
    let queryresponse = await GetReports(30); //This could work...?
    console.log(queryresponse);
    if (queryresponse instanceof Error)
    {
        return res.status(500).send({"success": false, "message": queryresponse.message})
    }
    else
    {
        return res.status(200).send({"success":true,"message":"Report Return Successful", "reports": queryresponse})
    }
});

//Get the Devices in the DB
app.get("/api/get-devices",ValidateToken, SetPermissions, async (req:Request,res:Response) => 
{
    let queryresponse = await GetDevices();
    console.log(queryresponse);
    if (queryresponse instanceof Error)
    {
        return res.status(500).send({"success": false, "message": queryresponse.message})
    }
    else
    {
        return res.status(200).send({"success":true,"message":"Devices Return Successful", "devices": queryresponse})
    }
});

//-------------------------------------------------------------

//------------------Post Requests-------------------

//*User Sign In
app.post("/api/login", SanatizeInput("username","E"), SanatizeInput("password","P"),async (req:Request,res:Response) => 
{
    let {username, password} = req.body; //Parse Request
    console.log(username,password);
    let QueryResponse: any = await RetreivePassword(username,1); //Check to see if the logger is a User
    if(QueryResponse instanceof Error) //If Query is an Error
        return res.status(500).send({"success":false, message: QueryResponse.message});
    let admin = false;
    if(QueryResponse.length === 0) //If nothing is returned, check to see if the logger is an Admin
    {
        QueryResponse = await RetreivePassword(username,0); 
        if(QueryResponse instanceof Error) //If Query is an Error
            return res.status(500).send({"success":false, message: QueryResponse.message});
        admin = true;
    }
    let ReturnMessage = {"success": false, "message": "Invalid password or email"};
    console.log(QueryResponse);
    if(QueryResponse.length === 0) //If the Query is still nothing after checking admin and user, return Wrong email or password
    {
        return res.status(401).send(ReturnMessage);
    }
    else //If we do get a response, compare...
    {
        if(QueryResponse[0].Password === password) //If passwords match up...
        {
            //Adjust Message to reflect States
            ReturnMessage.success = true; 
            ReturnMessage.message = "Login Successful";
            let payload = {"tokenexpiresin": 3600};
            if (admin)
            {
                Object.assign(payload, {"permissions": 524287}); //Admin Permissions and payload info
            }
            else
            {
                Object.assign(payload,{"userId": QueryResponse[0].AccountID, "permissions": 35029});
            }
            let token = await SignToken(payload,"1h"); //Generate the token
            Object.assign(ReturnMessage, {"token": token}); //Appends to the previously defined object
            return res.status(200).send(ReturnMessage);
        }
        else //If passwords don't match, return Error. Mismatched password
        {
            console.log("Wrong password!"); 
            return res.status(401).send(ReturnMessage);
        }
    }
});

/*Refreshing Token
app.post("/refreshtoken", async (req:Request, res:Response) => {
    let ReturnMessage = {"success": false, "message": "Token Expired"};
    try {
          let Secretcode: any = process.env.JWT_secret;
          let payload: any = jwt.verify(req.body.refreshtoken, Secretcode);  // Verify the token through using the Secret Word. Throw an error otherwise.
          let token = await SignToken(payload,"1h");
          ReturnMessage.success = true; 
          ReturnMessage.message = "Login Successful";
          Object.assign(ReturnMessage, {"token": token, "expiresIn":3600}); //Appends to the previously defined object
          return res.status(200).send(ReturnMessage);
    } 
    catch (err) 
    {
        return res.status(403).send(ReturnMessage);
    }
});
*/

app.post("/api/register-code", SanatizeInput("email","E"), async (req:Request,res:Response) =>{
    console.log("Post Request");
    let emailResponse =  await SendVerificationEmail(req.body.email);
    if (emailResponse instanceof Error)
    {
        console.log("Error");
        return res.status(500).send({"success":false,"message":emailResponse.message});
    }
    else
    {
        console.log("Success");
        return res.status(200).send(emailResponse);
    }
});

//*Registering Users
app.post("/api/register-user", SanatizeInput("firstName","N"),SanatizeInput("lastName","N"),SanatizeInput("email","E"),SanatizeInput("password","P"), ValidateVerificationCode,async (req: Request, res: Response) => { //This function is async as we have a function inside that is accessing a resource. Function returns a void type of promise
    console.log(req.body);
    let AccountID = req.body.lastName[0] + req.body.firstName[0] + Math.random().toString().substring(2,8) + req.body.password.substring(2,5);
    let token = (await SignToken({"userId": AccountID},'1h')).toLocaleLowerCase().slice(-30);  //This is for the QR code
    console.log(token);
     //Timestamps when the request comes in, or whenever a code is scanned
    let response: Error | any = await RegNewUser(`Students`,AccountID,req.body.firstName,req.body.lastName,new Date(req.body.dateOfBirth).toISOString().slice(0,19).replace("T", " "),req.body.email,req.body.major,req.body.password,token,new Date().toISOString().slice(0, 19).replace("T", " ")); //Accessing said resource, so we need to wait for a responses
    if(response instanceof Error)
    {
        return res.status(500).send({"success":false,"message": "Verification code was successful, but there was an error: " + response.message}); //Sends the Error
    }
    else
    {
        return res.status(200).send(response);
    }
});



//*Making a reservation for a device
app.post("/api/reserve", ValidateToken, async (req: Request, res: Response) => 
{// We write the code with the intention that times are blocked between devices(2 Hour Increments, 3 Hour, etc.)
    let reservations = [];
    let status:string;
    let reason:string | number;
    let index: number = 0;
    let response = {"success":false, "message": "Transaction Start/Commit Error"};
    let QueryResponse;
    if(req.body.reservations)
    {
        QueryResponse = await StartTranaction();
        if(QueryResponse instanceof Error)
        {
            return res.status(500).send(response);
        }
        for(let x of req.body.reservations) //For every reservation that is sent to us from frontend...
        {
            QueryResponse = await RequestReservation("Reservations",req.body.userId, x.deviceName, x.deviceId,x.time); //...try to add it to the reservations table.
            console.log("Reserving: ",x," with userId: ", req.body.userId);
            if(QueryResponse instanceof Error) //If we don't get an error...
            {
                await RollbackTransaction(); //Rollback all the requests we've made so far
                return res.status(500).send({"success":true, "message": QueryResponse.message}); //Send Response
            }
            else
            {
                reservations.push({"deviceId": x.deviceId, //Add the information of the reservation and its status of completion to an array...
                    "device": x.device,
                    "time": x.time});
            }
        }
        QueryResponse = await CommitTransaction(); //Commit all reservations
        if(QueryResponse instanceof Error)
        {
            return res.status(500).send(response);
        }
    }
    console.log(reservations);
    res.send({"success":true, "message": reservations}); //...and the array gets send back to frontend.
});

//*Returns the reservations made for a certain date
app.post("/api/search-date", ValidateToken, async (req: Request,res: Response)  => {
    let qreserved: any = await ReturnDevices("Reservations",req.body.fullDate); //Get all the data, in order of Device ID;
    let devices = []; 
    let reservedtw = [];
    let previd = {"deviceName": "Dummy", "deviceId" : -1}; //For first check
    for(let x of qreserved) //Go through Data
    {
        if(previd.deviceId == x.deviceId || previd.deviceId == -1)//Add the times and status
        {
            reservedtw.push({"startTime": x.StartTime.toLocaleTimeString("en-US").toString(),"endTime":x.EndTime.toLocaleTimeString("en-US").toString(), "Status":x.ResStatus});
        }
        else //Upon encountering a new device, append the previous device with array of times, and start a new time array for the current device
        {
            devices.push({"deviceId": `${previd.deviceId}`, "deviceName":`${previd.deviceName}`, "timeWindows": JSON.parse(JSON.stringify(reservedtw))}); //There is only shallow copying in JS, so we need to deep copy
            reservedtw.length = 0;
            reservedtw.push({"startTime": x.StartTime.toLocaleTimeString("en-US").toString(),"endTime":x.EndTime.toLocaleTimeString("en-US").toString(), "status":x.ResStatus});
        }
        console.log(reservedtw.length)
        previd = x;
    }
    devices.push({"deviceId": `${previd.deviceId}`, "deviceName":`${previd.deviceName}`, "timeWindows": reservedtw}); //After the last entry is read, append the last entry along with its array. This doesn't need deep copy as its the most recent one
    let DateArray = new Date(req.body.fullDate).toLocaleDateString().split("/")
    let response = {"selectedDate": `${DateArray[2]}-${DateArray[0]}-${DateArray[1]}`, "devices": devices}; //THIS NEEDS TESTING. Should be returning Year Month Day
    return res.send(response);
});

//*Return the CheckIn's
app.post("/api/history",ValidateToken, SetPermissions, async (req:Request, res: Response) => //We will build the query based on conditionals
{
    if(req.body.admin) //If an admin is calling...
    {
        //Do a Union, descending by Starttime
        let query = `select * from ScanHistory where StartTime between '${new Date(req.body.startDate).toISOString()}' and '${new Date(req.body.endDate).toISOString()}'` //We wrap the input dates for protection...
        /*if(req.body.AccountID)
        {
            query += ` and ID = ${req.body.ID}`
        }*/
        query += ' Order DESCENDING by StartTime';
        let query2 = `select * from ReservationHistory where StartTime between '${new Date(req.body.startdate).toISOString()}' and '${new Date(req.body.enddate).toISOString()}'` //We wrap the input dates for protection...
        /*if(req.body.ID)
        {
            query2 += ` and ID = ${req.body.ID}`
        }*/
        query2 += ' Order DESCENDING by StartTime';
        
        let scanhistory: any = await checkinhistory(query); 
        let reservationhistory:any = await checkinhistory(query2);
        let returnmessage = {"success": false, "messasage": "Error in Returning Query"}
        if (scanhistory instanceof Error || reservationhistory instanceof Error)
        {
            return res.status(500).send(returnmessage);
        }
        else
        {
            returnmessage.success = true;
            returnmessage.messasage = "Success in returning info";
            Object.assign(returnmessage,{"scanHistory": scanhistory, "reservationHistory":reservationhistory});
            return res.status(200).send(returnmessage);
        }
    }
    else //If User is Calling...
    {
        let query = `select * from ScanHistory where StartTime between '${new Date(req.body.startdate).toISOString()}' and '${new Date(req.body.enddate).toISOString()}'` //We wrap the input dates for protection...
        query += `where AccountID = ${req.body.userId}`
        query += ' Order DESCENDING by checkin';
        //Return Histories between time period where the ID matches their own ID
        let query2 = `select * from ReservationHistory where StartTime between '${new Date(req.body.startdate).toISOString()}' and '${new Date(req.body.enddate).toISOString()}'` //We wrap the input dates for protection...
        query2 += `where AccountID = ${req.body.userId}`
        query2 += ' Order DESCENDING by StartTime';
        
        let scanhistory: any = await checkinhistory(query); 
        let reservationhistory:any = await checkinhistory(query2);
        let returnmessage = {"success": false, "messasage": "Error in Returning Query"}
        if (scanhistory instanceof Error || reservationhistory instanceof Error)
        {
            return res.status(500).send(returnmessage);
        }
        else
        {
            returnmessage.success = true;
            returnmessage.messasage = "Success in returning info";
            Object.assign(returnmessage,{"scanHistory": scanhistory, "reservationHistory":reservationhistory});
            return res.status(200).send(returnmessage);
        }

    }
});

//*Cancel Reservation
app.post("/api/cancel-reservation",ValidateToken,SetPermissions,async (req:Request, res:Response) => 
{
    let query = `Delete from Reservations WHERE ReservationID = ${req.body.recordId}`
    let response:any;
    if(req.body.admin) //If an Admin is cancelling Reservation
    {   
        response = await CancelReservation(query);
    }
    else //If user is cancelling Reservation
    {
        //As we are only allowing the user to see reservations they have, we can assume, for now, that they will only make cancelations for reservations they have. Change this later...
        response = await CancelReservation(query);
    }
    if(response instanceof Error)
    {
        return res.status(500).send({"success":false, "message": response.message});
    }
    return res.status(200).send({"success":true, "message": "Reservation Cancelled"});
});

//*Submitting Reports (USER ENDPOINT ONLY)
app.post("/api/submit-report", ValidateToken, async (req:Request,res:Response) =>  //ValidateToken is removed for Testing...
{
    let queryresponse = await SubmitReport(req.body.type,new Date(req.body.time).toISOString().slice(0, 19).replace("T", " "),req.body.deviceId,req.body.deviceName,req.body.description);
    if(queryresponse instanceof Error)
    {
        return res.status(500).send({"success": false, "message":queryresponse.message});
    }
    else
    {
        return res.status(200).send({"success":true, "message": "Report Submitted"});
    }
});

app.post("/api/create-device",async (req:Request,res:Response) => //ValidateToken,SetPermissions,
{   
    let queryresponse = await CreateDevice(req.body.deviceName,req.body.description);
    if(queryresponse instanceof Error)
    {
        return res.status(500).send({"success": false, "message":queryresponse.message});
    }
    else
    {
        return res.status(200).send({"success":true, "message": "Device Added"});
    }
});

//Non-Promise Based Post Request
/*app.post("/registeruser",  (req: Request, res: Response): void => { //This function is async as we have a function inside that is accessing a resource. 
    console.log(req.body);    console.log(`${req.body.email}`)

    pool.query(`INSERT INTO studentuser (AccountID,firstName,lastName,EMAIL,MAJOR) VALUES (123456885,"sergio","man","pok@gmail.com","EFG")`,
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
app.post("/scan", async (req:Request,res:Response) => 
{
    const currentDate = new Date().toISOString(); //Timestamps when the request comes in, or whenever a code is scanned
    const response = await NewScan("ScanIns",req.body.ID, currentDate); //Passes the ID, time and date in a format acceptable to SQL so query can take place.
    return res.send("Scan Executed");
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

   

    

//---------------Null code---------------
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
    