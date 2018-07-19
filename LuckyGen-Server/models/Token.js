const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
 	_user: {type: String, ref: 'User'},
 	title: String,
 	sign: String
}, { timestamps: true });


const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
