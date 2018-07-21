const Wallet = require('../models/Wallet')
const User = require('../models/User')
const Game = require('../models/Game')
const Nebulas = require('nebulas')
const axios = require('axios')

const MASTER_ADDRESS = require('../config/net').MASTER_ADDRESS
const SMART_CONTRACT_ADDR = require('../config/net').SMART_CONSTRACT_ADDR

const neb = require('./neb').neb
const api = require('./neb').api;
const admin = require('./neb').admin;
const Transaction = require('./neb').Transaction;
const MASTER_ACC = require('./neb').MASTER_ACC;

module.exports.getHistory = ({game_id}, callback) => {
	api.call({
	   chainID: 1001,
	   from: MASTER_ADDRESS,
	   to: SMART_CONTRACT_ADDR,
	   value: "0",
	   nonce: "0",
	   gasPrice: 1000000,
	   gasLimit: 2000000,
	   contract: {
	       function: "getGameResultByGameId",
	       args: JSON.stringify([game_id])
	   }
	}).then(function(tx) {
		console.log({tx})
		let result 
		try {
			result = JSON.parse(JSON.parse(tx.result))
		} catch (e) {
			console.log('Error when decode JSON', {tx}, {e})
			return callback(e)
		}

		const prizes = new Map
		
		// Seed the prizes
		result.prizeStructure
			.sort((a, b) => a.prizePercentage > b.prizePercentage)
			.forEach(prize => {
				prizes.set(prize.prize.prizeId, {
					prizeName: prize.prize.prizeName,
					prizePercentage: prize.prizePercentage,
					prizeNumberOf: prize.prizeNumberOf,
					prizeRemain: prize.prizeRemain,
					players: []
				})
			})

		result.winners.forEach(winner => {
			let currentPrize = prizes.get(winner.prize.prizeId)
			currentPrize.players.push({
				playerId: winner.player.playerId,
				playerName: winner.player.playerName,
				playerAddress: winner.player.playerAddress,
			})
			prizes.set(winner.prize.prizeId, currentPrize)
		})

		console.log({prizes})

	    return callback(null, Array.from(prizes.values()))
	}).catch(e => {
		return callback(e)
	});
}

module.exports.addNewPlayerToGame = ({
    game_id,
    player_id,
    player_address,
    player_name,
    turns
}, callback) => {
	console.log({game_id})
    Game.findById(game_id).populate({
            path: '_user',
            model: 'User',
            populate: {
                path: 'wallets',
                model: 'Wallet'
            }
        }).then(game => {
        const wallet = game._user.wallets.pop()

        const playerObj = {
        	playerId: player_id,
        	playerName: player_name,
        	playerAddress: player_address,
        	spinNumberOf: turns,
        }

        console.log({playerObj})

        const bussinessAcc = new Nebulas.Account
		const v4 = wallet.keystring
		bussinessAcc.fromKey(v4, wallet.passphrase, true)

		console.log({bussinessAcc})

		console.log({MASTER_ACC})
        
        try {
		    neb.api.getNebState().then((nebstate) => {
				neb.api.getAccountState(bussinessAcc.getAddressString()).then((accstate) => {
					const txData = {
				        chainID: nebstate.chain_id,
				        from: bussinessAcc,
				        to: SMART_CONTRACT_ADDR,
				        value: 0,
				        nonce: parseInt(accstate.nonce) + 1,
				        gasPrice: 1000000,
				        gasLimit: 2000000,
				        contract: {
					       function: "addNewPlayerToGame",
					       args: JSON.stringify([game.idNet, JSON.stringify(playerObj)])
					   }
				    }
				    console.log({txData})

				    var tx = new Transaction(txData);
				    tx.signTransaction();

				    neb.api.sendRawTransaction({
			            data: tx.toProtoString()
			        }).then(function({txhash}) {
						console.log({txhash})
						waitForTxSuccess(txhash, (err, result) => {
							if (err) return callback(err)

							return callback(null, result)
						})
					}).catch(err => {
						console.log('I have error')
						callback(err)
					});
				}).catch (err => {
					console.log('Nebulas net error', { err })
					callback(err)
				})
			}).catch (err => {
				console.log('Nebulas net error', { err })
				callback(err)

			})
		} catch (err) {
			console.log('Nebulas net error', { err })
			callback(err)
		}
    })
}

module.exports.addNewGameToBusiness = ({
    business_id,
    game_config
}, callback) => {
     try {
	    neb.api.getNebState().then((nebstate) => {
			neb.api.getAccountState(MASTER_ADDRESS).then((accstate) => {
				const txData = {
			        chainID: nebstate.chain_id,
			        from: MASTER_ACC,
			        to: SMART_CONTRACT_ADDR,
			        value: 0,
			        nonce: parseInt(accstate.nonce) + 1,
			        gasPrice: 1000000,
			        gasLimit: 2000000,
			        contract: {
				       function: "addNewGameToBusiness",
				       args: JSON.stringify([1, JSON.stringify(game_config)])
				   }
			    }
			    console.log({txData})

			    var tx = new Transaction(txData);
			    tx.signTransaction();

			    neb.api.sendRawTransaction({
		            data: tx.toProtoString()
		        }).then(function({txhash}) {
					console.log({txhash})
					waitForTxSuccess(txhash, (err, result) => {
						if (err) return callback(err)

						return callback(null, result)
					})
				}).catch(err => {
					console.log('I have error')
					callback(err)
				});
			}).catch (err => {
				console.log('Nebulas net error', { err })
				callback(err)
			})
		}).catch (err => {
			console.log('Nebulas net error', { err })
			callback(err)
		})
	} catch (err) {
		console.log('Nebulas net error', { err })
		callback(err)
	}
}

