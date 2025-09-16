import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import dotenv from "dotenv";


const sendMail=async(options)=>{
    const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        // Appears in header & footer of e-mails
        name: 'Task Manager',
        link: 'https://mailgen.js/'
        // Optional product logo
        // logo: 'https://mailgen.js/img/logo.png'
    },
});
 var emailText = mailGenerator.generatePlaintext(options);
 var emailHtml= mailGenerator.generate(options.mailGenContent);


 const transporter = nodemailer.createTransport({
  host: "process.env.MAILTRAP_SMTP_HOST",
  port: process.env.MAILTRAP_SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "process.env.MAILTRAP_SMTP_USER",
    pass: "process.env.MAILTRAP_SMTP_PASS",
  },
});


const  mail={
     from: 'mail.taskmanager@example.com', // sender address
    to: 'options.email', // list of receivers
    subject: "options.subject", // Subject line
    text: "emailText", // plain‑text body
    html: "emailHtml", // HTML body

}
try{
    
await transporter.sendMail(mail);

}catch(err){
    console.log(err);
}


}

const emailVerificationMailGenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to Task Manager! We're very excited to have you on board.",
      action: {
        instructions: "To get started with Task Manager, please click here:",
        button: {
          color: "#22BC66", // Optional action button color
          text: "Confirm your account",
          // ❌ You hardcoded the link
          // ✅ Use the function parameter
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we’d love to help.",
    },
  };
};

const forgotPasswordMailGenContent = (username, resetUrl) => {
  return {
    body: {
      name: username,
      intro: "We received a request to reset your password for Task Manager.",
      action: {
        instructions: "Click the button below to reset your password:",
        button: {
          color: "#DC4D2F", // red-ish for warning action
          text: "Reset your password",
          link: resetUrl, // dynamic reset link
        },
      },
      outro:
        "If you didn’t request a password reset, you can safely ignore this email. Your password will remain unchanged.",
    },
  };
};




// sendMail({
//     email:user.email,
//     subject:"Please verify your email",
//     mailGenContent:
// })