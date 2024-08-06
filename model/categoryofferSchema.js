const mongoose = require('mongoose');

const categoryOfferSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    categoryName: { type: String },
    percentage: { type: Number },
    startDate: { type: Date },
    expiryDate: { type: Date },
    // status: { type: Boolean, default: true }
});

const categoryOffer = mongoose.model('categoryOffer', categoryOfferSchema);

module.exports = categoryOffer;
