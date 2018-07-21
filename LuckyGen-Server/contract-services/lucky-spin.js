const Wallet = require('../models/Wallet')
const User = require('../models/User')
const Game = require('../models/Game')
const Nebulas = require('nebulas')
const axios = require('axios')

const MASTER_ADDRESS = "n1ViirLQuno8zvx8KEf8B3RuXAfvKThY3yP"
const SMART_CONTRACT_ADDR = require('../config/net').SMART_CONSTRACT_ADDR
const NET_URL = require('../config/net').NET_URL


axios.interceptors.request.use(function (config) {
    // Do something before request is sent
    // console.log({config: config.data})
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  });

// Add a response interceptor
axios.interceptors.response.use(function (response) {
    // Do something with response data
    // console.log({response})

    return response;
  }, function (error) {
    // Do something with response error
    return Promise.reject(error);
  });

const neb = new Nebulas.Neb()

neb.setRequest(new Nebulas.HttpRequest(NET_URL));

const admin = neb.admin;

const MASTER_ACC = new Nebulas.Account
const v4 = '{"version":4,"id":"15a6fcde-4962-4722-8c56-c42df6c28e80","address":"n1ViirLQuno8zvx8KEf8B3RuXAfvKThY3yP","crypto":{"ciphertext":"3ceb39f15a0f515a1e1844c46468db1f98e1a6d5c9a1a0d71422ea5a0e856787","cipherparams":{"iv":"eca8941b1f4c69c31acbcc0d2c806705"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"ed71f4ede744a0dd17dde1a239a3c7c4af9d2e46bd68075a477ab1e21496b6f7","n":4096,"r":8,"p":1},"mac":"51226ecb5a80752cee0dd7bc370de2835ae88c97a24e155f0666a232aa3f9108","machash":"sha3256"}}'
MASTER_ACC.fromKey(v4, "123456789", true)

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

				    var tx = new Nebulas.Transaction(txData);
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

			    var tx = new Nebulas.Transaction(txData);
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

const waitForTxSuccess = (tx, callback) => {
	const maxTries = 30
	var currentTry = 0
	const api = neb.api;
	var interval
	try {
		interval = setInterval(() => {
			api.getTransactionReceipt({hash: tx})
			.then(function(receipt) {
				console.log({receipt})
				console.log("Wait Tx. Try " + currentTry)
				if (++currentTry > maxTries) {
					clearInterval(interval)
					return callback('Waiting for Tx success timeout of ' + maxTries+ ' tries')
				}
				if (receipt.status !== 2) {
					clearInterval(interval)
					if (receipt.status === 0) {
						return callback(receipt.execute_error)
					} else {
						return callback(null, receipt.execute_result)
					}
				}
			}).catch(err => {
				console.log('Nebulas net error', { err })
			})
		}, 1500)
	} catch(err) {
		console.log('Nebulas net error', { err })
	}
}