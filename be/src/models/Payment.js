const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose); 

const paymentSchema = new mongoose.Schema({
    paymentId: {type: Number, required: false, unique: true, index: true}, 
    vnpTxnRef: {type: String, required: false, index: true}, 
    momoTxnRef: { type: String, required: false, index: true},
    customerId: { type: Number, ref: 'Customer', required: true, index: true},
    priceId: {type: Number, required: true },
    amount: {type: Number, required: true},
    paymentDate: {type: Date, default: Date.now, required: true},
    expiryDate: {type: Date, required: true },
    paymentMethod: {type: String, required: true},
    status: {type: String, enum: ['success', 'failed', 'pending'], default: 'pending', required: true}
}, {collection: 'payments', timestamps: true});

paymentSchema.plugin(AutoIncrement, { inc_field: 'paymentId' });

module.exports = mongoose.model('Payment', paymentSchema);