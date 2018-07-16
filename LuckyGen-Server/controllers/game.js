const { parseObjectOfArray } = require('../helpers/utils')
const passport = require('passport')

/**
 * GET /create
 * Game page.
 */
exports.create = (req, res) => {
  res.render('games/create', {});
};


/**
 * Post /
 * Process create new game.
 */
exports.store = (req, res, next) => {
	// const prizes = parseObjectOfArray(req.body.prizes)

	// Submit to the net
	const gameID = Math.random()
	

	return res.json({
		game_id: Math.random()
	})
}
