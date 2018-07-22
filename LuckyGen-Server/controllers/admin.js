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
const neb = require('../contract-services/neb')
/**
 * GET /
 * List all games.
 */

/**
 * GET /
 * Manage enterprises.
 */
exports.index = (req, res) => {
    User.find()
        .populate('wallets')
        .populate('games')
        .then(users => {
            return res.render('admin/index', {
                title: 'Manage enterprise',
                users
            });
        })
        .catch(err => {
            return res.status(500).send(err)
        })
};

/**
 * Post /
 * Send money to enterprise
 */
exports.doSendMoney = async (req, res, next) => {
    req.assert('amount', 'Please enter amount to send')
	req.assert('wallet_address', 'Please enter wallet_address')

    const errors = req.validationErrors();

    if (errors) {
        return res.status(400).send(errors);
    }

    neb.topUpWallet({ 
            address: req.body.wallet_address, 
            amount: req.body.amount,
            fromAccount: neb.MASTER_ACCOUNT,
            fromAddress: neb.MASTER_ADDRESS,
        }, (err, result) => {
        if (err) {
            console.log('Error when topup' , {err})
            return res.status(500).send(err)
        }

        return res.json({
            message: 'ok'
        })        
    })    	
}