const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
 	_business: {type: Number, ref: 'Business'},
 	id: String,
 	hash: String
}, { timestamps: true });


const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
