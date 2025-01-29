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
        /*
        await pool.query("DROP TABLE `Reservations`");
        await pool.query("DROP TABLE `ScanHistory`");
        await pool.query("DROP TABLE `Students`");
        await pool.query("DROP TABLE `ScanIn`");*/
        //For Testing Purposes only...Delete ^ When we actually deploy
        await pool.query("CREATE TABLE `Students` (`AccountID` varchar(50) NOT NULL,`FN` varchar(100) NOT NULL,`LN` varchar(100) NOT NULL, `DOB` DATETIME NOT NUll,`EMAIL` varchar(200) NOT NULL,`MAJOR` varchar(4) NOT NULL,`Password` varchar(200) NOT NULL, `StudentID` int (9) NOT NULL, PRIMARY KEY (`AccountID`),UNIQUE `StudentID` (`StudentID`), UNIQUE `EMAIL` (`EMAIL`))");
        await pool.query("CREATE TABLE `ScanIn` (`AccountID` varchar (50) NOT NULL,`StartTime` DATETIME NOT NULL, FOREIGN KEY (`AccountID`) REFERENCES `Students` (`AccountID`))");
        await pool.query("CREATE TABLE `Reservations` (`ReservationID` int NOT NULL AUTO_INCREMENT, `AccountID` varchar (50) NOT NULL,`DeviceID` int DEFAULT NULL,`DeviceName` varchar(20) DEFAULT NULL,`StartTime` datetime DEFAULT NULL,`EndTime` datetime DEFAULT NULL,`ResStatus` varchar(20) DEFAULT NULL,PRIMARY KEY (`ReservationID`), UNIQUE (`DeviceID`,`StartTime`)) "); //.query returns a "query packet", which you assign to arrays. 
        await pool.query("CREATE TABLE `ScanHistory` (`AccountID` varchar (50) NOT NULL,`StartTime` DATETIME NOT NULL,`EndTime` DATETIME NOT NULL,FOREIGN KEY (`AccountID`) REFERENCES `Students` (`AccountID`))");
        console.log("Created Tables");
    }
    catch(err){
        console.log("Error in creating tables: " + err);
    }  
}


//--------------Insert Queries------------------------


//Query For Registering Users
export async function RegNewUser (table:string,AccountID:string,FN:string,LN:string,DOB:string,Email:string,Major:string,Password:string,StudentID:string): Promise<any> { //This function needs to be await as we are accessing a database resource
    let response;
    try {
        response =  await pool.query(`INSERT INTO ${table} (AccountID, FN,LN,DOB,EMAIL,MAJOR,Password,StudentID) VALUES (?,?,?,Date(?),?,?,?,?)`, [AccountID,FN,LN,DOB,Email,Major,Password,StudentID]); //.query returns a "query packet", which you assign to arrays. 
        return response + ": Registered New User";
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