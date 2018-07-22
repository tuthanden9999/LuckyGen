const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Nebulas = require('nebulas')

const walletSchema = new mongoose.Schema({
 	_user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
 	keystring: String,
 	passphrase: String
}, { timestamps: true });

walletSchema.methods.getAddress = function() {
	var obj = null
	try {
		obj = JSON.parse(this.keystring)
	} catch (e) {
		console.log({e})
	}

	return obj === null ? null : obj.address
}

walletSchema.methods.toNebAccount = function() {
	const nebAccount = new Nebulas.Account
	nebAccount.fromKey(this.keystring, this.passphrase, true)
	return nebAccount
}

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
