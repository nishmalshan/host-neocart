const mongoose = require('mongoose');
require('dotenv').config()



const orderSchema = new mongoose.Schema({
    status: {
        type: String,
        default: 'Pending'
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },
    items: [{
        status: {
            type: String,
            default: 'Ordered'
        },
        returnReason: { type: String, default: "Not Returned" },
        returnStatus: { type: String },
        image: { type: String },
        name: { type: String },
        price: { type: Number },
        productId: { type: mongoose.Schema.ObjectId, ref: 'product'},
        size: { type: Number },
        quantity: { type: Number}
    }],
    address: [{
        name: { type: String },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String},
        phone: { type: Number },
    }],
    coupons:[{ type: mongoose.Schema.Types.ObjectId }],
    paymentMethod: { type: String },
    paymentStatus: { type: String },
    totalPrice: { type: Number },
    orderDate: { type: Date },
    arrivingDate: { type: Date },
    paymentId: { type: String },
    reason: { type: String, default: 'Not Cancelled'}
})




const orders = mongoose.model('order', orderSchema)
module.exports = orders