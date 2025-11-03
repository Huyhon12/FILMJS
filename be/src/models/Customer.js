const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose); 

const customerSchema = new mongoose.Schema({
    customerId: { type: Number},
    Name: { type: String, required: true, unique: true },
    Email: { type: String, required: true, unique: true },
    Phone: { type: String, required: true },
    Password: { type: String, required: true },
    ExpiryDate: { type: Date, default: null },
    PriceId: {type: Number, default: 0},
}, { 
    collection: 'customers' 
});

customerSchema.plugin(AutoIncrement, { inc_field: 'customerId' });

module.exports = mongoose.model('Customer', customerSchema);