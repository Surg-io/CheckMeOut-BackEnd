import mysql, { QueryResult } from 'mysql2';
import express, { Express, NextFunction, Request, Response } from "express";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import { time } from 'console';
dotenv.config();

// ~MYSQL Databasse Connection~
const pool = mysql.createPool({  //You can go without the .promise(). If you initialize a pool without.promise(), you will have to rely on callback functions. 
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();


//---------------Table Queries------------------------

export async function CreateTables()
{
    try {
        await pool.query("DROP TABLE `Reservations`");
        await pool.query("DROP TABLE `ReservationHistory`");
        await pool.query("DROP TABLE `ScanHistory`");
        await pool.query("DROP TABLE `ScanIn`");
        await pool.query("DROP TABLE `Students`");
        await pool.query("DROP TABLE  `RegistrationVerificationCodes`")
        await pool.query("DROP TABLE `Admins`")
        
        //For Testing Purposes only...Delete ^ When we actually deploy
        await pool.query("CREATE TABLE `Students` (`AccountID` varchar(50) NOT NULL,`FN` varchar(100) NOT NULL,`LN` varchar(100) NOT NULL, `DOB` DATETIME NOT NUll,`EMAIL` varchar(200) NOT NULL,`MAJOR` varchar(4) NOT NULL,`Password` varchar(200) NOT NULL, `StudentID` int (9) NOT NULL, `QRCode` varchar(50) NOT null, `Created` datetime not null, PRIMARY KEY (`AccountID`),UNIQUE `QRCode` (`QRCode`),UNIQUE `StudentID` (`StudentID`), UNIQUE `EMAIL` (`EMAIL`))");
        await pool.query("CREATE TABLE `ScanIn` (`AccountID` varchar (50) NOT NULL,`StartTime` DATETIME NOT NULL, FOREIGN KEY (`AccountID`) REFERENCES `Students` (`AccountID`))");
        await pool.query("CREATE TABLE `Reservations` (`ReservationID` int NOT NULL AUTO_INCREMENT, `AccountID` varchar (50) NOT NULL,`DeviceID` int DEFAULT NULL,`DeviceName` varchar(20) DEFAULT NULL,`StartTime` datetime DEFAULT NULL,`EndTime` datetime DEFAULT NULL,`ResStatus` varchar(20) DEFAULT NULL,PRIMARY KEY (`ReservationID`), UNIQUE (`DeviceID`,`DeviceName`,`StartTime`)) "); //.query returns a "query packet", which you assign to arrays. 
        await pool.query("CREATE TABLE `ReservationHistory` (`ReservationID` int NOT NULL AUTO_INCREMENT, `AccountID` varchar (50) NOT NULL,`DeviceID` int DEFAULT NULL,`DeviceName` varchar(20) DEFAULT NULL,`StartTime` datetime DEFAULT NULL,`EndTime` datetime DEFAULT NULL,`ResStatus` varchar(20) DEFAULT NULL,PRIMARY KEY (`ReservationID`), UNIQUE (`DeviceID`,`DeviceName`,`StartTime`)) "); //.query returns a "query packet", which you assign to arrays. 
        await pool.query("CREATE TABLE `ScanHistory` (`AccountID` varchar (50) NOT NULL,`StartTime` DATETIME NOT NULL,`EndTime` DATETIME NOT NULL,FOREIGN KEY (`AccountID`) REFERENCES `Students` (`AccountID`))");
        await pool.query("CREATE TABLE `RegistrationVerificationCodes` (`Email` varchar(100) NOT NULL, `Code` int(9), Primary Key(`Email`))");
        await pool.query("CREATE TABLE `Admins` (`Email` varchar(100) NOT NULL, `Password` varchar(50) NOT NULL, Primary Key(`Email`))");
        console.log("Created Tables");
    }
    catch(err){
        console.log("Error in creating tables: " + err);
    }  
}


//--------------Insert Queries------------------------


//Query For Registering Users
export async function RegNewUser (table:string,AccountID:string,FN:string,LN:string,DOB:string,Email:string,Major:string,Password:string,StudentID:string,Code:string,Date:string): Promise<any> { //This function needs to be await as we are accessing a database resource
    let response;
    try {
        response = await pool.query(`INSERT INTO ${table} (AccountID, FN,LN,DOB,EMAIL,MAJOR,Password,StudentID,QRCode) VALUES (?,?,?,Date(?),?,?,?,?,?,?)`, [AccountID,FN,LN,DOB,Email,Major,Password,StudentID,Code,Date]); //.query returns a "query packet", which you assign to arrays. 
        return {"success":true,"message": response + ": Registered New User"};
    }
    catch(err){
        response = Error("Error in registering new user: " + err);
        return response;
    }  
}
//Query For Putting in Scans
export async function NewScan(table:string, ID:string, Datetime:string)
{
    try {

        let response =  await pool.query(`INSERT INTO ${table} (STUDENTID, starttime) VALUES (?,?,?)` , [ID,Datetime]); //.query returns a "query packet", which you assign to arrays. 
        console.log(response + ": New Scan Detected");
    }
    catch(err){
        console.log("Error in entering new scan: " + err);
    }  
}

export async function RequestReservation(table:string, device:string, ID:string, time:Date)
{
    try{
        let sstime = new Date(time); 
        let timeelapsed = .5; //Number of Hours a reservation slot is...
        //For below, Student ID is currently a placeholder...make sure we adjust before rollout
        await pool.query(`INSERT INTO ${table} (studentID, deviceID, deviceName, starttime, endtime, resstatus) VALUES ('67890', ?, ?, ?, ?, 'Reserved');`,[ID,device,sstime,new Date(sstime.setHours(sstime.getHours() + timeelapsed))]); //ENSURE RESERVATIONS TABLE HAS UNIQUE (DEVICEID AND STARTTIME) FUNCTIONALITY
        return [1, "NA"];
    }
    catch (err) {
        const error = err as Error; //This typecasts the err into an Error type, so we can now process it line by line.
        return [0, error.message.split('\n')[0]];
    }
}

export async function SendVerificationEmail(Email:string)
{
    let isthereError = false;
    let errormsg;
    let verificationcode = Math.random().toString().substring(2,8);
    
   
    try
    {
        //Deletes the Email if it Exists Already
        await pool.query(`DELETE FROM RegistrationVerificationCodes Where Email id = ?`, Email);
        await pool.query(`Insert into RegistrationVerificationCodes (Email, Code) VALUES (?,?)`,[Email,verificationcode]);
        console.log("Query Send");
    }
    catch(err)
    {
        isthereError = true;
        errormsg = err;
    }
    if(isthereError)
        {
            return Error("Error in Logging Code in DB" + errormsg);
        }
    try
    {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.Makerspace_Email,
              pass: process.env.Makerspace_Email_Password
            }
          });
        var mailOptions = {
            from: process.env.Makerspace_Email,
            to: Email,
            subject: "Email Verification Code",
            text: `Thank you for your interest in the makerspace. To complete the registration process, enter the following code with your information on the registration page: ${verificationcode}. Thank you for joining the Makerspace!`
          };
          //await transporter.sendMail(mailOptions);
    }
    catch(err)
    {
        isthereError = true;
        errormsg = err;
    }
    if(isthereError)
    {
        console.log("Returning Error");
        return Error("Error in Sending Email" + errormsg);
    }
    else
    {
        console.log("Returning Success Statement");
        return {"status":true, "message":"Verification Information Sent and Logged Successfully"};
    }
}
//----------------Select Queries----------------------

export async function GetQRCode(AccID:string)
{
    try{
        const [rows] = await pool.query(`SELECT QRCODE FROM STUDENTS WHERE ACCOUNTID = ?`, AccID); //Should only return one...
        return rows;
    }
    catch(err)
    {
        return Error("Error in Returning QR Code: " + err);
    }
}

export async function GetUserData (): Promise<QueryResult> {
    const [rows] = await pool.query("SELECT * FROM student");
    return rows;
}

export async function ReturnDates (table:string, fullDate:string)
{
    try{
        const [rows] = await pool.query(`SELECT DISTINCT deviceID,deviceName,starttime,endtime FROM ${table} where starttime BETWEEN now() AND Date(?)`,[fullDate]) //Get Which Devices have reservations
        return rows;
    }
    catch (err) {
        console.log("Error in Returning reserved dates: " + err)
    }
}

export async function ReturnDevices (table:string, fullDate:string)
{
    try{
        const [rows] = await pool.query(`SELECT deviceName,deviceID,starttime,endtime,resstatus FROM ${table} where starttime BETWEEN now() AND Date(?) ORDER BY deviceID`,[fullDate]) //Get Which Devices have reservations
        return rows;
    }
    catch (err) {
        console.log("Error in Returning Reserved Devices: " + err)
    }
}

export async function checkinhistory(query:string)
{
    try{
        const [rows] = await pool.query(query); //Get the reservations based on the query
        return rows;
    }
    catch (err) {
        
        return Error("Error in returning Query" + err);
    }
}

export async function RetreivePassword(Username:string, Database: number)
{
    if (Database) //If You are querying in the Student Database
    {
        try{
            const [rows] =  await pool.query(`SELECT AccountID, Password from Students WHERE EMAIL = ?`,[Username]);//Get the reservations based on the query
            return rows;
        }
        catch (err) {
            return Error("Error in Returning Query of Students: " + err);
        }
    }
   else
   {
    try{
        const [rows] =  await pool.query(`SELECT Password from Admins WHERE EMAIL = ?`,[Username]);//Get the reservations based on the query
        return rows;
    }
    catch (err) {
        return Error("Error in Returning Query of Admins: " + err);
    }
   }
}

export async function ValidateVerificationCode(req:Request,res:Response,next:NextFunction)
{
    let rows : any;
    try{
        [rows] =  await pool.query(`SELECT Code from RegistrationVerificationCodes WHERE EMAIL = ?`,[req.body.Email]);//Get the code based on the email provided by the user
    }
    catch (err) {
        return res.status(401).send({"success": false, "message": "Error in retreiving Verification Code for User " + err});
    }
    if(!(rows[0].Code === req.body.Code)) //If verification code is not the same as the one we have in the DB for that given email
    {
        return res.status(401).send({"success": false, "message": "Verification Code is not valid for this email"});
    }


    next();
}

export async function CountUsers(timeframe:number) 
{
    let amount;
    try{
        switch(timeframe)
        {
            
            case 24: //1 day
            amount = await pool.query(`SELECT COUNT(*) FROM Students WHERE CREATED >= NOW() - INTERVAL '1 day'`);
                break;
            case 7: //7 days
            amount = await pool.query(`SELECT COUNT(*) FROM Students WHERE CREATED >= NOW() - INTERVAL '1 week`);
                break;
            case 30: //30 days
            amount = await pool.query(`SELECT COUNT(*) FROM Students WHERE CREATED >= NOW() - INTERVAL '1 month'`);
                break;
            default: //6 Months
            amount = await pool.query(`SELECT COUNT(*) FROM Students WHERE CREATED >= NOW() - INTERVAL '6 months'`);
        }
        return amount;
    }
    catch (err)
    {
        return Error("Error in Getting User Count" + err);
    }
}

export async function getReservations(timeRange: number) {
    const query = `SELECT DeviceID, DeviceName, COUNT(*) AS count FROM ReservationHistory WHERE StartTime >= NOW() - INTERVAL ? DAY GROUP BY DeviceID, DeviceName`;
        const [rows] = await pool.query(query, [timeRange]);
        return rows;
    
}

export async function CountCheckIns(timeRange:number)
{
    const query = `SELECT COUNT(*) FROM ScanHistory WHERE StartTime >= NOW() - INTERVAL ?`;
    const rows = await pool.query(query, [timeRange]);
    return rows;
}

/*We are not using this rn
export async function GetUserId (first_name: string, last_name: string, major: string, student_id: string) { // get all student info for using in the frontend when needed??
    try { // might handle cases for matching first name, ask is this you? or not etc..
    const [user_rows] = await pool
                              .query(`SELECT id 
                                      FROM student
                                      WHERE studentId == ${student_id} and 
                                            firstName == ${first_name} and 
                                            lastName == ${last_name}`);
        
        return user_rows;
    } 
    catch (query_error) {
        // possible errors?        
        console.log("ERROR: use id exception")
        return 
    }
}*/