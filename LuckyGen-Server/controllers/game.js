const {
    parseObjectOfArray
} = require('../helpers/utils')
const passport = require('passport')
const Game = require('../models/Game')
const User = require('../models/User')
const Wallet = require('../models/Wallet')
const SMART_CONSTRACT_ADDR = require('../config/net').SMART_CONSTRACT_ADDR
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
        idNet: req.params.id
    }, function(err, game) {
        if (err) return res.status(404).send()
            
        if (!game._user.equals(req.user._id)) return res.status(403).send()

        const { player_id, player_address, player_name, turns } = req.body

        gameService.addNewPlayerToGame({game_id: game._id, player_id, player_address, player_name, turns}, (err, result) => {
            if (err) {
                console.log({err})
                return res.status(500).json({message: 'Add player to game failed!'})
            }

            return res.send(result)
        })
    })
};
/**
 * Post /
 * Process create new game.
 */
exports.store = async (req, res, next) => {
	req.assert('title', 'Please enter game\'s title')

    const errors = req.validationErrors();

    if (errors) {
        return res.status(400).send(errors);
    }

    const game = new Game({
        _user: req.user._id,
        title: req.body.title,
    })

    const wallet = await Wallet.findById(req.user.wallets.pop())

    if (!wallet) {
        return res.status(500).send('Business does not have a wallet!')
    }

    game.save(function(err) {
    	if (err) {
            req.flash('errors', err);
            return res.redirect('back')
        }

        const prizes = parseObjectOfArray(req.body.prizes)

        const game_config = {
            businessAddress: wallet.getAddress(),
            prizeStructure: prizes.map((p, index) => {
                return {
                    prize: {
                        prizeId: index,
                        prizeName: p.title
                    },
                    prizePercentage: parseInt(p.percentage),
                    prizeNumberOf: parseInt(p.quantity),
                }
            }),
        }

        console.log("GAME CONFIG IS: ", game_config)

        gameService.addNewGameToBusiness({ business_id: 1, game_config }, (err, result) => {
            if (err) {
                console.log('Error when add new game to business into SC. Destroy game with id ' + game._id , {err})
                game.remove()
                return res.status(500).send(err)
            }

            var gameResult
            try {
                gameResult = JSON.parse(JSON.parse(result))
            } catch (err) {
                console.log('Error when parse addNewGameToBusiness result from net', result , {err})
                return res.status(500).send(err)
            }

            const html = ejs.render(gamePrototype1, {
                ASSET_HOST: 'http://localhost:8080',
                GAME_ID: gameResult.gameId,
                SMART_CONSTRACT_ADDR,
            })

            console.log({gameResult})

            game.widget = html
            game.idNet = gameResult.gameId
            game.save()

            console.log('Game saved')

            Game.findOne({_id: game._id}, function(e, g) { console.log(g) })
            
            User.update({ _id: req.user._id }, { $push: { games: game._id }}, function(error) {
                if (error) {
                    return res.status(500).send(err);
                } else {
                    return res.status(200).json({
                        'message': 'Create game successfully!'
                    })
                }
            })
        })    	
    })
}