const mongoose = require('mongoose')
require('dotenv').config()


const otpSchema = new mongoose.Schema({
    otp: {
        type: String
    },
    email: {
        type: String
    },
    otpAdded: {
        type: Date
    },
    expireAt: {
        type: Date
    }
})


const otpmodel = mongoose.model('OTP',otpSchema)
module.exports = otpmodel