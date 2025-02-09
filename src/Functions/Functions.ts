import express, { Express, Request, Response } from "express";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { NextFunction } from "express";
dotenv.config(); // Load environment variables from .env file
//---------------Sign Token-------------------
export async function SignToken(Information:Object): Promise<any> //All we need to do is create the token. The frontend should be sending it under the "Authorization" Header
{
    let payload : Object = Information;
    let Secretcode: any = process.env.JWT_secret;
    const token = jwt.sign(payload, Secretcode ,{expiresIn: "1d"}); //WE NEED TO SET THE SECRET IN .ENV, BUT ITS NOT WORKING RN...PLACEHOLDER VALUE
    return token;
}

//---------------Token Validation-------------------
export async function ValidateToken(req:Request, res:Response, next:NextFunction)
{
    const authHeader = req.get("Authorization"); //Get the value of the Authorization Header...
    //const authHeader = req.headers["Authorization"];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Authorization": "Bearer <token>". Token is gotten if it exists, hence logical and
    if (!token) {
      return res.status(401).send({ message: 'Access denied. No token provided.' });
    }
    try {
      let Secretcode: any = process.env.JWT_secret;
      const payload = jwt.verify(token, Secretcode);  // Verify the token through using the Secret Word. Throw an error otherwise.
      Object.assign(req.body, payload); // Attach the payload to req.user
      next(); // Proceed to the next middleware or route handler
    } catch (err) {
      return res.status(403).send({ message: 'Invalid or expired token.' });
    }
}


//---------------Input Sanatization-------------------
const NameRegex = new RegExp('^[A-Z][a-z]{0,99}$');
const EmailRegex = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
const PassRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;


export function SanatizeInput(input:string, type:string): boolean {
    //We will use a char to denote what regex we are going to use
    switch(type)
    {
        case 'N': //Name Sanitize
            return NameRegex.test(input);
        case 'E': //Email Sanitize
            return EmailRegex.test(input);
        case 'P': //Password Sanatize
            return PassRegex.test(input);
        default:
            return false;
    }
}

//------------------Email Sending-----------------------


export async function SendEmail(Name:string, Email:string): Promise<any>
{
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.Makerspace_Email,
          pass: process.env.Makerspace_Email_Password
        }
      });
    var mailOptions = {
        from: process.env.Makerspace_Email,
        to: Email,
        subject: "Welcome",
        text: `Thank you ${Name} for joing the Makerspace!`
      };
      try
      {
        await transporter.sendMail(mailOptions);
        return "Registration Complete";
      }
      catch(err)
      {
        return Error("Error in Sending Email" + err);
      }

}
