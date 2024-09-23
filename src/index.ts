import express, { Express, Request, Response } from "express";
import {GetUserId, GetUserData} from './sql/database.js'; // tsc creates error, doesnt include .js extension - because of ESM and node shit, just leave it like this with .js
import bodyParser from "body-parser";

const port: Number = Number(process.env.PORT) || 8000; // remove port later in dev
const app: Express = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
//app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
//app.use(express.static('public')); Don't know why we need this
//let start = 1; Don't know why we need this
app.get("/", (req: Request, res: Response): void => {
    console.log("Recieved request");
    // res.render('index');
});

app.post("/registeruser", (req: any, res: Response): void => {
    res.set('Access-Control-Allow-Origin', '*');
    console.log(req.body);
    res.send("Request Received");
});
// register route, does it need any info? or will use the request body
app.put("/", async (req: Request, res: Response): Promise<void> => {
    res.set('Access-Control-Allow-Origin', '*');
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

    

app.listen(port, (): void => {
    console.log(`listening on port ${port}`);
});

