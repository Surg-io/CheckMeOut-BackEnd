import express, { Express, Request, Response } from "express";
import {GetUserId, GetUserData, RegNewUser,NewScan} from './sql/database.js'; // tsc creates error, doesnt include .js extension - because of ESM and node shit, just leave it like this with .js
import bodyParser from "body-parser";
import { time } from "console";
//import { timeStamp } from "console";
//var time = require("express-timestamp");

// ~Express Server Initialization/Method Handling~

const port: Number = Number(process.env.PORT) || 8000; // remove port later in dev
const app: Express = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/registeruser",(req, res, next) => { //Function will configure the CORS policy for this API. See CORS policy
    res.setHeader("Access-Control-Allow-Origin", `*`); //Allows Requests from every Origin(Any IP /Frontend)
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT"); //Allows these methods from said Origin
    res.setHeader("Access-Control-Allow-Headers", "Content-Type"); //Allows the modification of these headers to use in our API.Json specifically is a content header
    next();
});

app.get("/", (req: Request, res: Response): void => {
    console.log("Recieved request");
    res.send("Get Method");
});

//------------------Post Requests-------------------
//*Registering Users
//Promise Based Post Request
//When frontend users click register to register to the system. This 
app.post("/registeruser", async (req: Request, res: Response): Promise<void> => { //This function is async as we have a function inside that is accessing a resource. 
    console.log(req.body);
    const response = await RegNewUser("studentuser",req.body.ID,req.body.FN,req.body.LN,req.body.Email,req.body.Major); //Accessing said resource, so we need to wait for a responses
    res.send(response);
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


app.get("/returndata", async (req:Request,res:Response): Promise<void> =>
{
    
    res.send("Data Returned");
});




app.listen(port, (): void => {
    console.log(`listening on port ${port}`);
});


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
    

