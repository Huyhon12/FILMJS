const mongoose = require('mongoose');
const genreSchema = new mongoose.Schema({
  genreId : {type: Number, required: true},
  name : {type: String, required: true},
  type: {type: String, required: true}
}, { collection:'genres'});

module.exports = mongoose.model('Genre', genreShema);

