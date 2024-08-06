const mongoose = require('mongoose');
require('dotenv').config()



const producOfferSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'product',
    },
    discountPrecentage: {
        type: Number,
    },
    startDate: {
        type: Date,
    },
    expiryDate: {
        type: Date
    }
});


const ProductOffer = mongoose.model('ProductOffer', producOfferSchema)

module.exports = ProductOffer