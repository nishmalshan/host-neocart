const mongoose = require('mongoose');
require('dotenv').config()



const cartSchema = new mongoose.Schema({
    userId: mongoose.Types.ObjectId,
    products:[{
        productId: mongoose.Types.ObjectId,
        quantity: {
            type: Number
        },
        size: {
            type: Number
        }
    }]
})




const cart = mongoose.model('cart', cartSchema)
module.exports = cart;