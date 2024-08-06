const OTP = require('../model/otpSchema');
const bcrypt = require('bcrypt');
const email = require('../controller/userController');
const generateOTP = require('../utils/otpgenerator');
const mail = require('../utils/mailSender');
const {AUTH_MAIL} = process.env;




const sendOtp = async (email) => {
    try {
        if(!email) {
            throw error("Provide the email")
        }

        await OTP.deleteOne({email})

        const generatedOTP = await generateOTP();
        console.log(generatedOTP,"otpotpotpotpotp");

        const hashedOtp = await bcrypt.hash(generatedOTP, 10)

        const mailOptions = {
            from: AUTH_MAIL,
            to: email,
            subject: "Verify the email using this otp",
            html: `<p>Hello user use the this otp to verify your email to continue </p> <p style="color:#0b57d0;font-size:25px;letter-spacing:2px;">
            <b>${generatedOTP}</b></p><p>OTP will expire in<b> 10 minute(s)</b>.</p>`
        }

        await mail(mailOptions)

        function addMinutesToDate(date, minutes) {
            return new Date(date.getTime() + minutes * 60000)
        }

        const currentDate = new Date()
        const newDate = addMinutesToDate(currentDate, 5);
        const newOtp = new OTP({
            email,
            otp: hashedOtp,
            otpAdded: Date.now(),
            expireAt: newDate
        })

        const createdOtp = await newOtp.save()

        return createdOtp
    } catch (error) {
        console.log(error);
    }
}



module.exports = sendOtp