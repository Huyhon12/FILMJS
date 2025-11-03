const mongoose = require('mongoose');

// Sử dụng mongoURI 
const mongoURI = process.env.MONGO_URI || "mongodb+srv://FilmJS:TMDTNHOM8@filmjs.upqo0zv.mongodb.net/FilmJS";

const db = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
    }
};

module.exports = db;