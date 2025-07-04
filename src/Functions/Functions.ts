import express, { Express, Request, Response } from "express";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { NextFunction } from "express";
import { AnyARecord } from "dns";
dotenv.config(); // Load environment variables from .env file
//---------------Sign Token-------------------
export async function SignToken(Information:Object, time:any): Promise<string> //All we need to do is create the token. The frontend should be sending it under the "Authorization" Header
{
    let Secretcode: any = process.env.JWT_secret; //Need to seperate it as ts doesn't allow direct insertion...
    let token = jwt.sign(Information, Secretcode ,{expiresIn: time}); 
    return token;
}

//---------------Token Validation-------------------
export async function ValidateToken(req:Request, res:Response, next:NextFunction)
{
    const authHeader = req.get("Authorization"); //Get the value of the Authorization Header...
    //const authHeader = req.headers["Authorization"];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Authorization": "Bearer <token>". Token is gotten if it exists, hence logical and
    if (!token) {
      return res.status(401).send({ "success": false, "message": 'Access denied. No token provided.' });
    }
    try {
      let Secretcode: any = process.env.JWT_secret;
      const payload = jwt.verify(token, Secretcode);  // Verify the token through using the Secret Word. Throw an error otherwise.
      Object.assign(req.body, payload); // Attach the payload to req.body
      next(); // Proceed to the next middleware or route handler
    } catch (err) {
      return res.status(401).send({"success":false,  "message": 'Invalid or expired token.' });
    }
}

export async function SetPermissions(req:Request, res:Response, next:NextFunction)
{
  let permission = req.body.permissions;
  if (permission == 524287) //If the Person loggin in is an admin
  {
      Object.assign(req.body,  {"admin": 1}); // Makes an Admin Attribute and attaches it to req body
  }
  next();
}

//---------------Input Sanatization-------------------
const NameRegex = new RegExp('^[A-Z][a-z]{0,99}$');
const EmailRegex = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
const PassRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;


export function SanatizeInput(field:string, type:string) {
  
  return (req: Request, res: Response, next: NextFunction) => {
    const input = req.body[field];
    console.log(PassRegex.test(input));
    let isValid = false;
    switch (type) {
        case 'N': // Name validation
            isValid = NameRegex.test(input);
            break;
        case 'E': // Email validation
            isValid = EmailRegex.test(input);
            break;
        case 'P': // Password validation
            isValid = PassRegex.test(input);
            break;
        default:
            isValid = false;
    }

    if (!isValid) {
        return res.status(401).send({"success":false, "message":`Invalid ${field}: Does not match requirements`});
    }
    next();
};
}

//--------------Calculating Device Totals------------------
export function calculateTotal(devices: any) {
  return devices.reduce((total:any, device:any) => total + device.count, 0);
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
        return Error("Registration Complete, but error in sending email" + err);
      }

}

