const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
 	_user: {type: String, ref: 'User'},
 	keystring: String,
 	passphrase: String
}, { timestamps: true });


const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
