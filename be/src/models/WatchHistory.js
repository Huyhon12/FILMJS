const mongoose = require('mongoose');

const movieHistorySchema = new mongoose.Schema({
    movieId: { type: Number, ref: 'Movie', required: true },
    createdAt: { type: Date, default: Date.now } 
}, { _id: false });

const watchhistorySchema = new mongoose.Schema({
    customerId: { type: Number, ref: 'Customer', required: true, unique: true },
    movies: [movieHistorySchema]
}, { collection: 'watchhistories', timestamps: true });

module.exports = mongoose.model('WatchHistory', watchhistorySchema);