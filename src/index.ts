import express, { Express, Request, Response } from "express";
import fileo from 'fs';

const port: number = 3000;
const app: Express = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
let start = 1;

app.get("/", (req: Request, res: Response): void => {
    // res.render('index');
});

// register route, does it need any info? or will use the request body
app.put("/register", (req: Request, res: Response): void => {
    // talk to mysql database and update the database
    // rerq body should give me the few items from the form

    const {first_name,last_name,email,major,student_id,} = req.body;
    // let first_name: String = req.params.first_name;
    // let last_name: String = req.params.last_name;
    // let email: String = req.params.email;
    // let major: String = req.params.major;
    // let student_id: String = req.params.id;

    let number_id = Number(student_id);
    if (isNaN(number_id)) {
        res.status(200).send('Success!'); 
    }
    else {
        res.status(200).send('Failure, bad id sent!');
    }

    res.status(400).send('bad request');
    res.status(404).send('not found');
    
});

    

app.listen(port, (): void => {
    console.log(`listening on port ${port}`);
});

