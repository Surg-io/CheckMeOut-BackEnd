const express = require('express');

const app = express();
app.use(express.static('public'));
app.use(express.json()); // parse json body in request object


// create routes
// ** HOME **
app.get('/', (request, response) => {
    // home page
 
});

// register route, does it need any info? or will use the request body
app.put("/register", async (req, res) => {
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
        const user_id = await GetUserId(first_name, last_name, major, student_id)
        // handle error, or output from databas search.
    }
    else {
        res.status(400).send('Failure, bad id sent!');
    }

    res.status(400).send('bad request');
    res.status(404).send('not found');    
});

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`started server on: ${PORT}`);
});

