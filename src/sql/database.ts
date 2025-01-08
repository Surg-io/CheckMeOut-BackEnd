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
export async function NewScan(table:string, ID:string,Time:string,Date:string)
{
    try {
        let response =  await pool.query(`INSERT INTO ${table} (STUDENTID,CNTIME,CNDATE) VALUES (?,?,?)` , [ID,Time,Date]); //.query returns a "query packet", which you assign to arrays. 
        console.log(response + ": New Scan Detected");
    }
    catch(err){
        console.log("Error in entering new scan: " + err);
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
        const [rows] = await pool.query(`SELECT deviceName,deviceID,starttime,endtime FROM ${table} where starttime BETWEEN Date("2024-12-23T08:00:00.000Z") AND Date(?)`,[fullDate]) //Get Which Devices have reservations
        return rows;
    }
    catch (err) {
        console.log("Error in Returning reserved dates: " + err)
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