const Token = require('../models/Token');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const passport = require("passport");

exports.store = (req, res, next) => {
    req.assert('title', 'Please enter title for the key');

    const token = new Token({
    	_user: req.user._id,
    	title: req.body.title
    })

    token.save((err) => {
    	if (err) return next(err)

	    const tokenBody = {
	    	data: {
	    		token_id: token._id,
	    		user_id: req.user._id,
	    	}
	    }

	    User.update({ _id: req.user._id }, { $push: { tokens: token._id }}, function(error) {
	    	if (error) next(err)

	    	const tokenString = jwt.sign(tokenBody, 'your_jwt_secret', { expiresIn: '1y' })

	    	res.send({
	    		token: tokenString
	    	})
	    })
    });
}