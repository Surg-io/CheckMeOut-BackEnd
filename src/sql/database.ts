import mysql from 'mysql2';
import dotenv from 'dotenv';
// import { query } from 'express';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();


export async function GetUserData () {
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