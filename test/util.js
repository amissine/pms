const { Asset, Keypair, BASE_FEE, Networks, Server } = require('stellar-sdk') // {{{1
const moment = require('moment')

const STELLAR_NETWORK = 'TESTNET' // {{{1
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const server = new Server(HORIZON_URL)
const XLM = Asset.native()

const now = moment.utc().startOf('minute')
const minTime = now.clone().startOf('month')
const maxTime = minTime.clone().endOf('month')
// }}}1
exports.createAccount = createAccount
exports.opts = opts

function opts ( // {{{1
  fee = BASE_FEE,
  networkPassphrase = Networks[STELLAR_NETWORK],
  timebounds = { minTime: minTime.unix(), maxTime: maxTime.unix()},
  memo, withMuxing
)
{
  return { fee, networkPassphrase, timebounds, memo, withMuxing };
}

function createAccount (pair = Keypair.random()) { // {{{1
  return pair.secret();
}
