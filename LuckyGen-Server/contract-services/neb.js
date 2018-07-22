const Nebulas = require('nebulas')
const generator = require('random-password')
const Wallet = require('../models/Wallet')
const NET_URL = require('../config/net').NET_URL
const MASTER_ADDRESS = require('../config/net').MASTER_ADDRESS
const SMART_CONTRACT_ADDR = require('../config/net').SMART_CONTRACT_ADDR

const Neb = Nebulas.Neb
const Account = Nebulas.Account
const neb = new Neb()
const admin = neb.admin
const api = neb.api

neb.setRequest(new Nebulas.HttpRequest(NET_URL))

const MASTER_ACC = new Nebulas.Account
const v4String = '{"version":4,"id":"15a6fcde-4962-4722-8c56-c42df6c28e80","address":"n1ViirLQuno8zvx8KEf8B3RuXAfvKThY3yP","crypto":{"ciphertext":"3ceb39f15a0f515a1e1844c46468db1f98e1a6d5c9a1a0d71422ea5a0e856787","cipherparams":{"iv":"eca8941b1f4c69c31acbcc0d2c806705"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"ed71f4ede744a0dd17dde1a239a3c7c4af9d2e46bd68075a477ab1e21496b6f7","n":4096,"r":8,"p":1},"mac":"51226ecb5a80752cee0dd7bc370de2835ae88c97a24e155f0666a232aa3f9108","machash":"sha3256"}}'
MASTER_ACC.fromKey(v4String, "123456789", true)

module.exports.neb = neb
module.exports.admin = neb
module.exports.Account = Account
module.exports.api = api
module.exports.MASTER_ACC = MASTER_ACC
module.exports.Transaction = Nebulas.Transaction

module.exports.newAccount = (callback) => {
    const newAccount = new Account.NewAccount()
    const passphrase = generator(10)

    const newWallet = new Wallet({
        keystring: newAccount.toKeyString(passphrase),
        passphrase
    })

    newWallet.save(err => {
        if (err) return callback(err)

        return callback(null, newWallet)
    })
}

module.exports.topUpWallet = ({address, amount, fromAccount, fromAddress}, callback) => {
    try {
        neb.api.getNebState().then((nebstate) => {
            neb.api.getAccountState(fromAddress).then((accstate) => {
                const txData = {
                    chainID: nebstate.chain_id,
                    from: fromAccount,
                    to: address,
                    value: amount * 1000000000000000000, // Convert to Wei
                    nonce: parseInt(accstate.nonce) + 1,
                    gasPrice: 1000000,
                    gasLimit: 2000000,
                }
                console.log({txData})

                var tx = new Nebulas.Transaction(txData);
                tx.signTransaction();

                neb.api.sendRawTransaction({
                    data: tx.toProtoString()
                }).then(function({txhash}) {
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

module.exports.waitForTxSuccess = waitForTxSuccess