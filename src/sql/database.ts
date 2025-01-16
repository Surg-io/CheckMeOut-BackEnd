import mysql, { QueryResult } from 'mysql2';
import dotenv from 'dotenv';
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
        let response =  await pool.query("CREATE TABLE `Reservations` (`reservation_id` int NOT NULL AUTO_INCREMENT,`studentID` varchar(20) DEFAULT NULL,`deviceID` int DEFAULT NULL,`deviceName` varchar(20) DEFAULT NULL,`starttime` datetime DEFAULT NULL,`endtime` datetime DEFAULT NULL,`resstatus` varchar(20) DEFAULT NULL,PRIMARY KEY (`reservation_id`) UNIQUE KEY (`deviceID`,`starttime`)) "); //.query returns a "query packet", which you assign to arrays. 
        await pool.query("CREATE TABLE `ScanHistory` (`SCANID` int NOT NULL AUTO_INCREMENT,`STUDENTID` int NOT NULL,`CNDATE` date NOT NULL,`CNTIME` time NOT NULL,PRIMARY KEY (`SCANID`),KEY `STUDENTID` (`STUDENTID`),FOREIGN KEY (`STUDENTID`) REFERENCES `studentuser` (`STUDENTID`))");
        await pool.query("CREATE TABLE `Students` (`STUDENTID` int NOT NULL,`FN` varchar(25) NOT NULL,`LN` varchar(40) NOT NULL,`EMAIL` varchar(100) NOT NULL,`MAJOR` varchar(4) NOT NULL,PRIMARY KEY (`STUDENTID`),UNIQUE KEY `STUDENTID` (`STUDENTID`),UNIQUE KEY `EMAIL` (`EMAIL`))");
        await pool.query("CREATE TABLE `Scans` (studentID varchar (20) not null,starttime datetime)");
        console.log(response + ": Registered New User");
    }
    catch(err){
        console.log("Error in creating tables: " + err);
    }  
}


//--------------Insert Queries------------------------


//Query For Registering Users
export async function RegNewUser (table:string,ID:string,FN:string,LN:string,Email:string,Major:string) { //This function needs to be await as we are accessing a database resource
    try {
        let response =  await pool.query(`INSERT INTO ${table} (STUDENTID,FN,LN,EMAIL,MAJOR) VALUES (?,?,?,?,?)`, [ID,FN,LN,Email,Major]); //.query returns a "query packet", which you assign to arrays. 
        console.log(response + ": Registered New User");
    }
    catch(err){
        console.log("Error in registering new user: " + err);
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

//----------------Select Queries----------------------


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
        const [rows] = await pool.query(query) //Get the reservations based on the query
        return rows;
    }
    catch (err) {
        console.log("Error in Returning Query of Check Ins: " + err)
        return err;
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