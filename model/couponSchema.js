const mongoose = require('mongoose');
require('dotenv').config();



const couponSchema = new mongoose.Schema({
  couponName: { type: String },
  couponCode: { type: String },
  minPurchaseAmount: { type: Number },
  maxPurchaseAmount: { type: Number },
  discountAmount: { type: Number },
  startDate: { type: Date },
  expiryDate: { type: Date },
  status: { type: Boolean, default: true }
});


const coupons = mongoose.model('coupon', couponSchema)

module.exports = coupons