const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  customerId: { type: Number, ref: 'Customer', required: true },
  movieId: { type: Number, ref: 'Movie', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: {type: String},
  createdAt: { type: Date, default: Date.now }
}, { collection: 'ratings' });

module.exports = mongoose.model('Rating', ratingSchema);