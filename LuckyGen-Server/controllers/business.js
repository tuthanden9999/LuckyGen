const Business = require('../models/Business');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
/**
 * POST /business
 * Create a new business
 */

exports.postBusiness = (req, res, next) => {
  req.assert('name', 'Business\'s name cannot be blank').notEmpty();
 
  const errors = req.validationErrors();

  if (errors) {
    return res.status(400).json(errors);
  }

  generateSecretToken(function(err, hash) {
    if (err) return res.status(500);

    Business.create({ name: req.body.name, secret: hash }, function (err, business) {
      if (err) return res.status(500);
      return res.json(business.toJSON());
    });
  })
};

function generateSecretToken(callback) {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return callback(err); }
    bcrypt.hash(Math.random(), salt, null, (err, hash) => {
      if (err) { return callback(err); }
      return callback(null, hash)
    });
  });
}