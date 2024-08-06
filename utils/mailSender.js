const nodemailer = require('nodemailer');
const {AUTH_MAIL, AUTH_PASSWORD} = process.env;

let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: AUTH_MAIL,
        pass: AUTH_PASSWORD
    }
})


mailTransporter.verify((error, success) => {
    if (error) {
        console.log(error);
    }else{
        // console.log("email is ready");
    }
})

const sendEmail = async (mailOptions) => {
    try {
        await mailTransporter.sendMail(mailOptions);
        console.log('Email send successfully');
        return;
    } catch (error) {
        console.log(error);
    }
}



module.exports = sendEmail