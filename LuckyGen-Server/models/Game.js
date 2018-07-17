const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
 	_user: {type: String, ref: 'User'},
 	title: String,
 	widget: String,
}, { timestamps: true });


const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
