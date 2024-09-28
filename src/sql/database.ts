import mysql, { QueryResult } from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({  //You can go without the .promise(). If you initialize a pool without.promise(), you will have to rely on callback functions. 
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();

export async function RegNewUser (table:string,ID:string,FN:string,LN:string,Email:string,Major:string) { //This function needs to be await as we are accessing a database resource
    try {
        let response =  await pool.query(`INSERT INTO ${table} (STUDENTID,FN,LN,EMAIL,MAJOR) VALUES (${ID},"${FN}","${LN}","${Email}","${Major}")`); //.query returns a "query packet", which you assign to arrays. 
        console.log(response + ": Registered New User");
    }
    catch(err){
        console.log("Error in registering new user: " + err);
    }  
}



export async function GetUserData (): Promise<QueryResult> {
    const [rows] = await pool.query("SELECT * FROM student");
    return rows;
}

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
}