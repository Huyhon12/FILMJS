const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema({
    priceId: {type: Number,required: true,unique: true},
    priceAmount: {type: Number,required: true},
    name: {type: String,required: true},
    duration: {type: Number,required: true},
    unit: {type: String,required: true,enum: ['day', 'month', 'year']},
    image: {type: String,required: false}}
    , {collection: 'prices',timestamps: true});

module.exports = mongoose.model('Price', priceSchema);