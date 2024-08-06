const mongoose = require('mongoose');
require('dotenv').config()





const returnOrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },
    items: [{
        
    }]
})