const mongoose = require('mongoose');
require('dotenv').config()




const wishlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId },
    productId: { type: mongoose.Types.ObjectId}
    
})





const wishlist = mongoose.model('wishlist', wishlistSchema)

module.exports = wishlist