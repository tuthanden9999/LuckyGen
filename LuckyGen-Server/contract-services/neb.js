const Nebulas = require('nebulas')
const generator = require('random-password')
const Wallet = require('../models/Wallet')

const fs = require('fs')
const MASTER_ADDRESS = ''
const MASTER_PRIV = ''
const Neb = Nebulas.Neb
const Account = Nebulas.Account
const neb = new Neb()
const admin = neb.admin

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