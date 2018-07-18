const {
    parseObjectOfArray
} = require('../helpers/utils')
const passport = require('passport')
const Game = require('../models/Game')
const User = require('../models/User')
const ejs = require('ejs')
const gamePrototype1 = require('fs').readFileSync(__dirname + '/../game-generators/prototypes/game1.ejs', {
    encoding: 'utf-8'
})
/**
 * GET /
 * List all games.
 */
exports.index = (req, res) => {
    Game.find({
        _id: {
            $in: req.user.games
        }
    }, function(err, games) {
        res.render('games/index', {
            title: 'List games',
            games
        });
    })
};
/**
 * GET /create
 * Game page.
 */
exports.create = (req, res) => {
    res.render('games/create', {
        title: 'Create game'
    });
};

/**
 * GET /create
 * Game page.
 */
exports.preview = (req, res, err) => {
    Game.findOne({
        _id: req.params.id
    }, function(err, game) {
        if (err) return next(err)
        res.render('games/preview', {
            title: 'Preview game',
            game
        });
    })
};


/**
 * Store /:game-id/players
 * Game page.
 */
exports.storeNewPlayer = (req, res, err) => {
    return res.json({ok: true})

    Game.findOne({
        _id: req.params.id
    }, function(err, game) {
        if (err) return next(err)
        res.render('games/preview', {
            title: 'Preview game',
            game
        });
    })
};
/**
 * Post /
 * Process create new game.
 */
exports.store = (req, res, next) => {
	req.assert('title', 'Please enter game\'s title')
    // const prizes = parseObjectOfArray(req.body.prizes)
    // Submit to the net
    const html = ejs.render(gamePrototype1, {
        ASSET_HOST: 'http://localhost:8080'
    })

    const game = new Game({
        _user: req.user._id,
        title: req.body.title,
        widget: html
    })

    game.save(function(err) {
    	if (err) {
            req.flash('errors', err);
            return res.redirect('back')
        }

    	User.update({ _id: req.user._id }, { $push: { games: game._id }}, function(error) {
	    	if (error) {
                req.flash('errors', err);
            } else {
                req.flash('success', { msg: 'Create game successfully!' });
            }

            res.redirect('back')
	    })
    })
}