const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username : String,
  password : String
}, { collection : 'admins'});

module.exports = mongoose.model('Admin' , adminSchema);