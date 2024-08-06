const mongoose = require("mongoose");
require('dotenv').config()

const userSchema = new mongoose.Schema({

    name:{ type: String, required: true },
    email:{ type: String, required: true, unique: true },
    mobile:{ type: Number, unique: true },
    password:{ type: String, required: true },
    confirmPassword:{ type: String },
    status: { type:Boolean, default: true },
    profilePhoto: { type: Object },
    referralCode: { type: String, unique: true },
    wallet: {
        balanceAmount: { type: Number, default: 0},
        transaction: [{
            amount: { type: Number },
            transactionType: { type: String, enum: ['debit', 'credit']},
            timestamp: { type: Date, default: Date.now },
            description: { type: String }
        }]
    },
    address: [{
        name: { type: String },
        address: {type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        phone: { type: Number }
    }]
});


const Users = mongoose.model('Users',userSchema);

module.exports = Users