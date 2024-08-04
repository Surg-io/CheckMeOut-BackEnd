CREATE DATABASE student_info;
USE student_info;

CREATE TABLE student (
    id integer PRIMARY KEY AUTO_INCREMENT,
    first_name varchar(45) NOT NULL,
    last_name varchar(45) NOT NULL,
    major varchar (45) NOT NULL,
    student_id varchar (9) NOT NULL    
);
-- this student id should be unique, or checked to be unique. 
-- maybe can givev unique att, and check if it exists within the datbase alreaddy
