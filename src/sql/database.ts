import mysql, { QueryResult } from 'mysql2';
import express, { Express, NextFunction, Request, Response } from "express";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import { time } from 'console';
import { NumericLiteral } from 'typescript';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc)
dotenv.config();

// ~MYSQL Databasse Connection~
const pool = mysql.createPool({  //You can go without the .promise(). If you initialize a pool without.promise(), you will have to rely on callback functions. 
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password:process.env.MYSQL_PASSWORD ,//process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: 3306, // Default MySQL port
    connectTimeout: 5000 // 5 seconds
}).promise();


//---------------For Testing----------------
export async function GetTableRows()
{
    try{
        const [rows] = await pool.query(`Select * from scanhistory`)
        return rows;
    }
    catch(err)
    {
        return Error("Error: "+ err);
    }
    
}

//---For Testing----------------
/*
export async function CreateTables()
{
    try {
        await pool.query("DROP TABLE IF EXISTS `Reservations`, `ReservationHistory`, `ScanHistory`, `ScanIns`, `Students`,`RegistrationVerificationCodes`,`Admins`, `Reports`,`Devices`");
        //For Testing Purposes only...Delete ^ When we actually deploy
        await pool.query("Create TABLE IF NOT EXISTS `Reports` (`ReportID` int NOT NULL AUTO_INCREMENT, `Type` varchar(30) NOT NULL, `Time` DATETIME NOT NULL, `DeviceID` int not null, `DeviceName` varchar(20) NOT NULL, `Description` varchar(250) NOT NULL, PRIMARY KEY (`ReportID`))");
        await pool.query("CREATE TABLE IF NOT EXISTS `Devices` (`DeviceID` int AUTO_INCREMENT, `DeviceName` varchar(20) NOT NULL, `Description` varchar(250), PRIMARY KEY (`DeviceID`))");
        await pool.query("CREATE TABLE IF NOT EXISTS `Students` (`AccountID` varchar(50) NOT NULL,`FN` varchar(100) NOT NULL,`LN` varchar(100) NOT NULL, `DOB` DATETIME NOT NUll,`EMAIL` varchar(200) NOT NULL,`MAJOR` varchar(4) NOT NULL,`Password` varchar(200) NOT NULL, `QRCode` varchar(50) NOT null, `Created` DATETIME not null, PRIMARY KEY (`AccountID`),UNIQUE `QRCode` (`QRCode`), UNIQUE `EMAIL` (`EMAIL`))"); //`StudentID` int (9) NOT NULL UNIQUE `StudentID` (`StudentID`)
        await pool.query("CREATE TABLE IF NOT EXISTS `ScanIns` (`AccountID` varchar (50) NOT NULL,`StartTime` DATETIME NOT NULL, FOREIGN KEY (`AccountID`))");
        await pool.query("CREATE TABLE IF NOT EXISTS `Reservations` (`ReservationID` int NOT NULL AUTO_INCREMENT, `AccountID` varchar (50) NOT NULL,`DeviceID` int NOT NULL,`DeviceName` varchar(20) NOT NULL,`StartTime` datetime DEFAULT NULL,`EndTime` datetime DEFAULT NULL,`ResStatus` varchar(20) DEFAULT NULL,PRIMARY KEY (`ReservationID`), UNIQUE (`DeviceID`,`DeviceName`,`StartTime`)) "); //.query returns a "query packet", which you assign to arrays. 
        await pool.query("CREATE TABLE IF NOT EXISTS `ReservationHistory` (`ReservationID` int NOT NULL AUTO_INCREMENT, `AccountID` varchar (50) NOT NULL,`DeviceID` int NOT NULL,`DeviceName` varchar(20) NOT NULL,`StartTime` datetime DEFAULT NULL,`EndTime` datetime DEFAULT NULL,`ResStatus` varchar(20) DEFAULT NULL,PRIMARY KEY (`ReservationID`), UNIQUE (`DeviceID`,`DeviceName`,`StartTime`)) "); //.query returns a "query packet", which you assign to arrays. 
        await pool.query("CREATE TABLE IF NOT EXISTS `ScanHistory` (`AccountID` varchar (50) NOT NULL,`StartTime` DATETIME NOT NULL,`EndTime` DATETIME NOT NULL)");
        await pool.query("CREATE TABLE IF NOT EXISTS `RegistrationVerificationCodes` (`Email` varchar(100) NOT NULL, `Code` int(9), Primary Key(`Email`))");
        await pool.query("CREATE TABLE IF NOT EXISTS `Admins` (`Email` varchar(100) NOT NULL, `Password` varchar(50) NOT NULL, Primary Key(`Email`))");
        console.log("Created Tables");
    }
    catch(err){
        console.log("Error in creating tables: " + err);
    }  
}
    */
//-------------------------------------------

//---------------Table Initialization Queries------------------------


export async function CreateTableScripts()
{
    //Script for transfering all people that didn't check out into checked out.
    await pool.query(`DELIMITER $$

CREATE EVENT TransferScanDataDaily
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '23:59:59') -- Starts at midnight tonight
DO
BEGIN
    -- Step 1: Insert rows from ScanIns to ScanHistory
    INSERT INTO ScanHistory (AccountID, StartTime, EndTime)
    SELECT 
        AccountID, 
        StartTime, 
        DATE_ADD(StartTime, INTERVAL 1 HOUR) AS EndTime -- Calculate EndTime
    FROM ScanIns;

    -- Step 2: Delete rows from ScanIns after transfer
    DELETE FROM ScanIns;
END$$

DELIMITER ;`);
}

export async function CreateDB()
{
    try {
        await pool.query("DROP DATABASE IF EXISTS `makerspacedb`");
        //For Testing Purposes only...Delete ^ When we actually deploy
        await pool.query("CREATE DATABASE IF NOT EXISTS `makerspacedb`");
        console.log("Created Database");
    }
    catch(err){
        console.log("Error in Creating DB tables: " + err);
    }  
}

export async function CreateTables()
{
    try {
        await pool.query("DROP TABLE IF EXISTS `ScanIns`, `Reservations`, `ReservationHistory`, `ScanHistory`, `RegistrationVerificationCodes`, `Admins`, `Reports`, `Devices`");
        await pool.query("DROP TABLE IF EXISTS `Students`");
        //For Testing Purposes only...Delete ^ When we actually deploy
        await pool.query("Create TABLE IF NOT EXISTS `Reports` (`ReportID` int NOT NULL AUTO_INCREMENT, `Type` varchar(30) NOT NULL, `Time` DATETIME NOT NULL, `DeviceID` int not null, `DeviceName` varchar(20) NOT NULL, `Description` varchar(250) NOT NULL, PRIMARY KEY (`ReportID`))");
        await pool.query("CREATE TABLE IF NOT EXISTS `Devices` (`DeviceID` int AUTO_INCREMENT, `DeviceName` varchar(20) NOT NULL, `Description` varchar(250), PRIMARY KEY (`DeviceID`))");
        await pool.query("CREATE TABLE IF NOT EXISTS `Students` (`AccountID` varchar(50) NOT NULL,`FN` varchar(100) NOT NULL,`LN` varchar(100) NOT NULL, `DOB` DATETIME NOT NUll,`EMAIL` varchar(200) NOT NULL,`MAJOR` varchar(4) NOT NULL,`Password` varchar(200) NOT NULL, `QRCode` varchar(50) NOT NULL, `Created` DATETIME not null, PRIMARY KEY (`AccountID`),UNIQUE `QRCode` (`QRCode`), UNIQUE `EMAIL` (`EMAIL`))"); //`StudentID` int (9) NOT NULL UNIQUE `StudentID` (`StudentID`)
        await pool.query("CREATE TABLE IF NOT EXISTS `ScanIns` (`AccountID` varchar (50) NOT NULL,`StartTime` DATETIME NOT NULL, FOREIGN KEY (`AccountID`) REFERENCES `Students` (`AccountID`))");
        await pool.query("CREATE TABLE IF NOT EXISTS `Reservations` (`ReservationID` int NOT NULL AUTO_INCREMENT, `AccountID` varchar (50) NOT NULL,`DeviceID` int NOT NULL,`DeviceName` varchar(20) NOT NULL,`StartTime` datetime DEFAULT NULL,`EndTime` datetime DEFAULT NULL, PRIMARY KEY (`ReservationID`), UNIQUE (`DeviceID`,`DeviceName`,`StartTime`)) "); //.query returns a "query packet", which you assign to arrays. 
        await pool.query("CREATE TABLE IF NOT EXISTS `ReservationHistory` (`ReservationID` int NOT NULL AUTO_INCREMENT, `AccountID` varchar (50) NOT NULL,`DeviceID` int NOT NULL,`DeviceName` varchar(20) NOT NULL,`StartTime` datetime DEFAULT NULL,`EndTime` datetime DEFAULT NULL,PRIMARY KEY (`ReservationID`), UNIQUE (`DeviceID`,`DeviceName`,`StartTime`)) "); //.query returns a "query packet", which you assign to arrays. 
        await pool.query("CREATE TABLE IF NOT EXISTS `ScanHistory` (`AccountID` varchar (50) NOT NULL,`StartTime` DATETIME NOT NULL,`EndTime` DATETIME NOT NULL)");
        await pool.query("CREATE TABLE IF NOT EXISTS `RegistrationVerificationCodes` (`Email` varchar(100) NOT NULL, `Code` varchar(9), Primary Key(`Email`))");
        await pool.query("CREATE TABLE IF NOT EXISTS `Admins` (`Email` varchar(100) NOT NULL, `Password` varchar(50) NOT NULL, Primary Key(`Email`))");
        console.log("Created Tables");
    }
    catch(err){
        console.log("Error in creating tables: " + err);
    }  
}
//--------------Transaction Helpers--------------------------

export async function StartTranaction()
{
    try
    {
        await pool.query(`Start Transaction`);
        return true;
    }
    catch(err)
    {
        return Error("Error in Starting Transaction" + err);
    }
}

export async function RollbackTransaction() {
    try
    {
        await pool.query(`Rollback`);
        return true;
    }
    catch (err)
    {
        return Error("Error in Rolling Back Transaction" + err);
    }
}   


export async function CommitTransaction()
{
    try{
        await pool.query(`Commit`);
        return true;
    }
    catch (err)
    {
        return Error("Error in Committing Transaction" + err);
    }
}

//-------------------------------------------------------------


//--------------Insert Queries------------------------


//Query For Registering Users
export async function RegNewUser (table:string,AccountID:string,FN:string,LN:string,DOB:string,Email:string,Major:string,Password:string,Code:string,Date:string): Promise<any> { //This function needs to be await as we are accessing a database resource
    let response;
    try {
        response = await pool.query(`INSERT INTO ${table} (AccountID, FN,LN,DOB,EMAIL,MAJOR,Password,QRCode, Created) VALUES (?,?,?,Date(?),?,?,?,?,?)`, [AccountID,FN,LN,DOB,Email,Major,Password,Code,Date]); //.query returns a "query packet", which you assign to arrays. 
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

        let response =  await pool.query(`INSERT INTO ${table} (AccountID, StartTime) VALUES (?,?,?)` , [ID,Datetime]); //.query returns a "query packet", which you assign to arrays. 
        console.log(response + ": New Scan Detected");
    }
    catch(err){
        console.log("Error in entering new scan: " + err);
    }  
}

export async function RequestReservation(table:string, accountId: number, deviceName:string, deviceId:number, time:Date)
{
    try{
        let sstime = dayjs(time); 
        let timeelapsed = 30; //Number of Hours a reservation slot is...
        //For below, Student ID is currently a placeholder...make sure we adjust before rollout
        const startTime = sstime.utc().format('YYYY-MM-DD HH:mm:ss');
        const endTime = sstime.add(timeelapsed, 'minute').utc().format('YYYY-MM-DD HH:mm:ss');
        await pool.query(`INSERT INTO ${table} (AccountID, DeviceID, DeviceName, StartTime, EndTime) VALUES (?, ?, ?, ?, ?);`,[accountId,deviceId,deviceName,startTime,endTime]); //ENSURE RESERVATIONS TABLE HAS UNIQUE (DEVICEID AND STARTTIME) FUNCTIONALITY
        return true;
    }
    catch (err) {
        return Error("Error in Making Reservation: "+ err);
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
        await pool.query(`DELETE FROM RegistrationVerificationCodes Where Email = ?`, Email);
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
          await transporter.sendMail(mailOptions);
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
        return {"success":true, "message":"Verification Information Sent and Logged Successfully"};
    }

}
//Submitting a report to the backend
export async function SubmitReport(T:string,Time:string,ID:number,Device:string,Description:string)
{
  try
  {
      await pool.query("Insert into Reports (Type,Time,DeviceID,DeviceName,Description) values (?,?,?,?,?)",[T,Time,ID,Device,Description]);
  }
  catch (err)
  {
      return Error("Error in Submitting Report: " + err);
  }
}
//Query for cancelling reservation
export async function CancelReservation(query:string)
{
  try
  {
      await pool.query(query);
      return true;
  }
  catch(err)
  {
      return Error("Error in Cancelling Reservation: " + err);
  }
}

//Query for Adding a device to our Database
export async function CreateDevice(Name:string,Description:string)
{
  try
  {
      await pool.query(`Insert into Devices (DeviceName,Description) VALUES (?,?)`, [Name, Description]);
  }
  catch(err)
  {
      return Error("Error in Creating Device:" + err);
  }
}





//----------------Select Queries----------------------

export async function GetQRCode(AccID:string) 
{
    try{
        const [rows] :any  = await pool.query(`Select QRCode FROM Students WHERE AccountID = ?`, AccID); //Should only return one...
        return rows;
    }
    catch(err)
    {
        return Error("Error in Returning QR Code: " + err);
    }
}

export async function GetUserData () {
    try{
        const [rows] = await pool.query("SELECT * FROM Students");
    return rows;
    }
    catch(err)
    {
        return Error("Error in Returning QR Code: " + err);
    }
    
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
        const [rows] = await pool.query(`SELECT deviceName,deviceID,starttime,endtime FROM ${table} where starttime BETWEEN now() AND Date(?) ORDER BY deviceID`,[fullDate]) //Get Which Devices have reservations
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
        console.log("Verifying...");
        console.log(req.body.email);
        [rows] =  await pool.query(`SELECT Code from RegistrationVerificationCodes WHERE Email = ?`,[req.body.email]);//Get the code based on the email provided by the user
        console.log(rows);
    }
    catch (err) 
    {
        return res.status(401).send({"success": false, "message": "Error in retreiving Verification Code for User " + err});
    }
    if(rows.length === 0 || !(rows[0].Code === req.body.code)) //If verification code is not the same as the one we have in the DB for that given email
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
            amount = await pool.query(`SELECT COUNT(*) FROM Students WHERE CREATED <= NOW() - INTERVAL '1 day'`); //Amount doesn't need to be an array as it is a value
                break;
            case 7: //7 days
            amount = await pool.query(`SELECT COUNT(*) FROM Students WHERE CREATED <= NOW() - INTERVAL '1 week`);
                break;
            case 30: //30 days
            amount = await pool.query(`SELECT COUNT(*) FROM Students WHERE CREATED <= NOW() - INTERVAL '1 month'`);
                break;
            default: //6 Months
            amount = await pool.query(`SELECT COUNT(*) FROM Students WHERE CREATED <= NOW() - INTERVAL '6 months'`);
        }
        return amount;
    }
    catch (err)
    {
        return Error("Error in Getting User Count" + err);
    }
}

export async function getNumReservations(timeRange: number) {
    const query = `SELECT DeviceID, DeviceName, COUNT(*) AS count FROM ReservationHistory WHERE StartTime <= NOW() - INTERVAL ? DAY GROUP BY DeviceID, DeviceName`;
        const [rows] = await pool.query(query, [timeRange]);
        return rows;
    
}

export async function CountCheckIns(timeRange:number)
{
    const query = `SELECT COUNT(*) FROM ScanHistory WHERE StartTime <= NOW() - INTERVAL ?`;
    const rows = await pool.query(query, [timeRange]); //Rows doesn't need to be an array as it is a value
    return rows;
}

export async function getPeakTime(timeRange:number) {
    const query = `
      SELECT 
        HOUR(CheckInTime) AS hour,
        COUNT(*) AS checkin_count
      FROM CheckIns
      WHERE CheckInTime <= NOW() - INTERVAL ? HOUR
      GROUP BY HOUR(CheckInTime)
      ORDER BY checkin_count DESC
      LIMIT 1;
    `;
    const [rows]:any = await pool.query(query, [timeRange]);
    if (rows.length > 0) {
      const peakHour = rows[0].hour;
      return {
        start: `${peakHour - 1}:00`,
        end: `${peakHour + 1}:00`,
      };
    }
    return null;
  } 

  export async function getCurrentReservations(query: string)
  {
    try
    {
        let [rows] = await pool.query(query);
        return rows;
    }
    catch(err)
    {
        return Error("Error in Current Reservation Query: "+ err);
    }
}



export async function GetReports(Time:Number)
{
    try{
        let [rows] = await pool.query(`Select * from Reports where Time <= NOW() - INTERVAL ? Day`, [Time]);
        return rows;
    }catch (err)
    {
        return Error("Error in getting Reports" + err);
    }
}


export async function GetDevices()
{
    try{
        let [rows] = await pool.query(`Select * from Devices`);
        return rows;
    }catch (err)
    {
        return Error("Error in getting Devices: " + err);
    }
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