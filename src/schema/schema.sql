-- We don't currently use anything in this file -- 
CREATE DATABASE student_info;
USE student_info;

CREATE TABLE student (
    -- qId integer PRIMARY KEY AUTO_INCREMENT, -- {qId} a more unique name to seperate from other forms of id's 
    id integer PRIMARY KEY AUTO_INCREMENT,
    firstName VARCHAR(45) NOT NULL,
    lastName VARCHAR(45) NOT NULL,
    email VARCHAR(55) NOT NULL,
    major VARCHAR (45) NOT NULL,
    studentId VARCHAR (9) NOT NULL    
);
-- this student id should be unique, or checked to be unique. 
-- maybe can givev unique att, and check if it exists within the datbase alreaddy
