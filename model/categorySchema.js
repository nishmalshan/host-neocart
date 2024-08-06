const mongoose = require("mongoose");
require('dotenv').config()

const categorySchema = new mongoose.Schema({

    name: {
        type: String
    },
    description: {
        type: String
    },
    image: {
        type: String
    },
    status: {
        type: Boolean,
        default: true
    }
})







const category = mongoose.model('category',categorySchema);

module.exports = category