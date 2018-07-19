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

const gameService = require('../contract-services').luckySpin
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
    req.assert('player_id', 'Player ID is required')
    req.assert('player_name', 'Player name is required')
    req.assert('player_address', 'Player address is required')
    req.assert('turns', 'Turns is required')

    const errors = req.validationErrors();

    if (errors) {
        return res.status(400).send(errors);
    }

    Game.findOne({
        _id: req.params.id
    }, function(err, game) {
        if (err) return res.status(404).send()
        if (game._user !== req.user._id) return res.status(403).send()

        const { player_id, player_address, player_name, turns } = req.body

        gameService.addNewPlayerToGame({game_id: game._id, player_id, player_address, player_name, turns}, (err, result) => {
            if (err) {
                console.log({err})
                return res.status(500).json({message: 'Add player to game failed!'})
            }

            res.send(result)
        })
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

        const game_config = {
            businessAddress: 'my-business-address',
            prizeStructure: [
                {
                    prize: {
                        prizeId: 1,
                        prizeName: 'Giai thuong 1'
                    },
                    prizePercentage: 50,
                    prizeNumberOf: 3,
                    prizeRemain: 3,
                },
                {
                    prize: {
                        prizeId: 2,
                        prizeName: 'Giai thuong 2'
                    },
                    prizePercentage: 40,
                    prizeNumberOf: 5,
                    prizeRemain: 5
                }
            ]
        }

        gameService.addNewGameToBusiness({ business_id: 1, game_config }, (err, result) => {
            if (err) {
                console.log('Error when add new game to business into SC. Destroy game with id ' + game._id , {err})
                game.remove()
                return res.status(500).send(err)
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
    })
}