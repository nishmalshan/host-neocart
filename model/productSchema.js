const mongoose = require('mongoose');
require('dotenv').config()
const category = require('../model/categorySchema');



const productSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true,
        unique: true
    },
    brand:{
        type: String,
        required: true
    },
    // category:[{
        categoryId: { type: mongoose.Schema.ObjectId, ref: 'category' },
        categoryName: { type: String, required: true },
    // }],
    description:{
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true,
        min: 0
    },
    images:{
        type: Array,
       
    },
    color:{
        type: String,
        required: true
    },
    discountAmount:{
        type: Number
    },
    categoryOffer:{
        type: Number
    },
    variant:[{
        size:{
            type: Number,
            required: true
        },
        quantity:{
            type: Number,
            required: true
        },
    }],
    status:{
        type: Boolean,
        default: true
    }},{
        timestamps: true
    })





    const product = mongoose.model('product',productSchema)

    module.exports = product