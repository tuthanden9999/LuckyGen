const { parseObjectOfArray } = require('../helpers/utils')

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
exports.store = (req, res) => {
	const prizes = parseObjectOfArray(req.body.prizes)

	// Submit to the net
	const gameID = Math.random()
	

	res.json({
		game_id: Math.random()
	})
}
