const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  movieId: {type: Number, required: true},
  name: { type: String, required: true },
  description: { type: String, required: true },
  rating: { type: Number, min: 0, max: 5 },
  image: { type: String, required: true },
  movieUrl: {type : String, required: true},
  genres: { type: [String] }
}, { collection: 'movies' });

module.exports = mongoose.model('Movie', movieSchema);