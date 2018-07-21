const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
// const mongoose = require('mongoose').set('debug', true);
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
 	_user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
 	title: String,
 	widget: String,
 	idNet: String,
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
