// const nodemailer = require("nodemailer");

// const mailSender = async (email, title, body) => {
//     try{
//             let transporter = nodemailer.createTransport({
//                 host:process.env.MAIL_HOST,
//                 auth:{
//                     user: process.env.MAIL_USER,
//                     pass: process.env.MAIL_PASS,
//                 }
//             })


//             let info = await transporter.sendMail({
//                 from: 'StudyNotion || CodeHelp - by Babbar',
//                 to:`${email}`,
//                 subject: `${title}`,
//                 html: `${body}`,
//             })
//             console.log(info);
//             return info;
//     }
//     catch(error) {
//         console.log(error.message);
//     }
// }


// module.exports = mailSender;


// utils/mailSender.js
const sgMail = require("@sendgrid/mail");
const dotenv = require("dotenv");
dotenv.config();
// Set the API key from the environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends an email using SendGrid.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML content of the email.
 * @returns {Promise} - The response from SendGrid.
 */
const sendEmail = async (to, subject, html) => {
    const msg = {
        to,
        from: process.env.MAIL_FROM, // This must be a verified sender
        subject,
        html,
    };

    try {
        const response = await sgMail.send(msg);
        return response;
    } catch (error) {
        console.error("SendGrid Error:", error);
        if (error.response) {
            console.error(error.response.body);
        }
        throw error;
    }
};

module.exports = sendEmail;
