import dotenv from 'dotenv';
dotenv.config();
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

//---------------Sign Token-------------------
export async function SignToken(payload:string): Promise<any>
{
   return jwt.sign({'AccountID': payload}, process.env.Secret ,{expiresIn: "7d"});
}

//---------------Cookie Validation-------------------
export async function ValidateToken(token:string): Promise<void>
{
    return jwt.verify(token, process.env.Secret);
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
