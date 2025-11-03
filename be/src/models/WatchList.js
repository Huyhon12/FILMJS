const mongoose = require('mongoose');

const movieWatchlistSchema = new mongoose.Schema({
    movieId: { type: Number, ref: 'Movie', required: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const watchlistSchema = new mongoose.Schema({
    customerId: { type: Number, ref: 'Customer', required: true, unique: true },
    movies: [movieWatchlistSchema]
}, { collection: 'watchlists', timestamps: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);