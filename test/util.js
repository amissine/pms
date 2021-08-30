const { Keypair } = require('stellar-sdk')

exports.createAccount = createAccount

function createAccount (pair = Keypair.random()) {
  return pair.secret();
}
