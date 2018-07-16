const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: String,
  secret: String,
  clients: [
  	{
  		type: mongoose.Schema.Types.ObjectId,
  		ref: 'Client'
  	}
  ]
}, { timestamps: true });


const Business = mongoose.model('Business', businessSchema);

module.exports = Business;
