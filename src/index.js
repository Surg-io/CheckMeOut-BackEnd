"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_js_1 = require("./public/sql/database.js");
const port = Number(process.env.PORT);
const app = (0, express_1.default)();
app.use(express_1.default.static('public'));
let start = 1;
app.get("/", (req, res) => {
    // res.render('index');
});
// register route, does it need any info? or will use the request body
app.put("/register", async (req, res) => {
    // talk to mysql database and update the database
    // rerq body should give me the few items from the form
    const { first_name, last_name, email, major, student_id, } = req.body;
    // let first_name: String = req.params.first_name;
    // let last_name: String = req.params.last_name;
    // let email: String = req.params.email;
    // let major: String = req.params.major;
    // let student_id: String = req.params.id;
    let number_id = Number(student_id);
    if (isNaN(number_id)) {
        res.status(200).send('Success!');
        const user_id = await (0, database_js_1.GetUserId)(first_name, last_name, major, student_id);
        // handle error, or output from databas search.
    }
    else {
        res.status(400).send('Failure, bad id sent!');
    }
    res.status(400).send('bad request');
    res.status(404).send('not found');
});
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
