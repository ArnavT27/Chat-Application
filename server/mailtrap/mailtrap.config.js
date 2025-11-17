const { MailtrapTransport } = require("mailtrap");
const nodemailer=require('nodemailer');
const TOKEN = process.env.MAIL_TRAP_TOKEN;
const sendMail=async(options)=>{
    const transporter=nodemailer.createTransport({
        host:process.env.EMAIL_HOST,
        port:process.env.EMAIL_PORT,
        auth:{
            user:process.env.EMAIL_USERNAME,
            pass:process.env.EMAIL_PASSWORD,
        }
    });
    const mailOptions={
        from:'Test <hello@example.com>',
        to:options.email,
        subject:options.subject,
        // text:options.message,
        html:options.html,
    }
    await transporter.sendMail(mailOptions);
}
exports.sendWelcomeEmail=async(options)=>{
    const transport = nodemailer.createTransport(
        MailtrapTransport({
            token: TOKEN,
        })
    );

    const sender = {
        address: "hello@demomailtrap.co",
        name: "Mailtrap Test",
    };

    const recipients = ["arnavloh@gmail.com"];

    try {
        const info = await transport.sendMail({
            from: sender,
            to: recipients,
            template_uuid: "9db3a354-b549-49f7-b2c6-b0f150a25126",
            template_variables: {
                name: options.name,
            },
        });
        console.log("Email sent:", info);
    } catch (err) {
        console.error("Error sending email:", err);
    }
}
module.exports=sendMail;
