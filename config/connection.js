const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();




const dbConnection = mongoose.connect(process.env.MONGODB_URI)

    .then(() => {
        console.log('DB Connected');
    }).catch((err) => {
        console.log('No connected',err);
    });


    module.exports = dbConnection;