const fetch = require('node-fetch') // {{{1
const BigNumber = require('bignumber.js')
const { Keypair, Networks, Asset, BASE_FEE, Operation, TransactionBuilder, Server } = require('stellar-sdk')
const moment = require('moment')
const u = require('./util')

const STELLAR_NETWORK = 'TESTNET' // {{{1
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const server = new Server(HORIZON_URL)
const XLM = Asset.native()

const UPLOAD_DIVISOR = 1000

let fields = JSON.stringify([ // {{{1
  {
    "name": "destination",
    "type": "string",
    "description": "Stellar public key account you'd like to pay to",
    "rule": "Must be a valid and funded Stellar public key"
  },  
  {
    "name": "source",
    "type": "string",
    "description": "Stellar public key controlled account",
    "rule": "Should be the Stellar address which has Turret signers attached"
  }
])
let fields64 = Buffer.alloc(fields.length, fields).toString('base64')
fields = encodeURI(fields64)
//console.log(`- fields:\n${fields}`)

const upload = // {{{1
  async ({txFunction, turret, sponsorPubkey, sponsorPrvkey}) => {
    console.log('- started upload')
    const txFbase64 = txFunction.toString('base64')
    const txF = encodeURI(txFbase64)
    let txFf
    try {
      txFf = await fee(
        cost(txFbase64, fields64), turret, sponsorPubkey, sponsorPrvkey
      )
    } catch(err) {
      console.error(err)
    }
    txFf = encodeURI(txFf)
    while (txFf.indexOf('+') > -1) {
      txFf = txFf.replace('+', '%2B')
    }

    let out
    await fetch(
      'http://127.0.0.1:8787/tx-functions',
      { method: 'POST', 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },  
        body: `txFunctionFields=${fields}&txFunction=${txF}&txFunctionFee=${txFf}` 
      }
    )
    .then(
      res => res.json()
      .then(json => { out = json; }), 
/* results: {{{2
{
  hash: '0d3d194d85de8265f7979a43a7d53af2ea00561d07e07868f4149c448c0d0fe7',
  signer: 'GBDU6GV5AZTZVFUGMIZDN7HKEYEOMC5WHKN5AVJPQVZSBFWH3Y4RNILN'
}
[2021-08-27 11:34:52] POST tss-wrangler.alec-missine.workers.dev/tx-functions HTTP/1.1 200 OK

{
  message: 'txFunction 0d3d194d85de8265f7979a43a7d53af2ea00561d07e07868f4149c448c0d0fe7 has already been uploaded to this turret',
  status: 400
}
[2021-08-27 11:44:37] POST tss-wrangler.alec-missine.workers.dev/tx-functions HTTP/1.1 400 Bad Request
}}}2 */
      err => console.log(err,
        "\n\tHave you started 'wrangler dev' in another terminal?\n"
      )
    );
    console.log('- ending upload...')
    return JSON.stringify(out);
  }

const run = // {{{1
  async () => {
    console.log('- started run')

    let out
    await fetch(
      'http://127.0.0.1:8787/tx-functions/0d3d194d85de8265f7979a43a7d53af2ea00561d07e07868f4149c448c0d0fe7',
      { method: 'POST', 
        headers: { 'Content-Type': 'application/json' },  
        body: `{"some":"json"}` 
      }
    )
    .then(
      res => res.json()
      .then(json => { out = json; }),
      err => console.log(err,
        "\n\tHave you started 'wrangler dev' in another terminal?\n"
      )
    );
    console.log('- ending run...')
    return JSON.stringify(out);
  }

const manageTxSigners = // {{{1
  async ({ body }) => {
    console.log('- started manageTxSigners')

    let out
    await fetch(
      `http://127.0.0.1:8787/ctrl-accounts/${body.sourceAccount}`,
      { method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify(body) 
      }
    )
    .then(
      res => res.json()
      .then(json => { out = json; }),
      err => console.log(err,
        "\n\tHave you started 'wrangler dev' in another terminal?\n"
      )
    );
    console.log('- ending manageTxSigners...')
    return JSON.stringify(out);
  }

const checkSetup = // {{{1
  async ({ body }) => {
    console.log(`- started checkSetup`)

    const keys = Keypair.fromSecret(body.secret)

    let out = await server.loadAccount(body.sourceAccount)
    .then(account => {
      if (account.thresholds.high_threshold == 4) {
        return 'account already set up';
      }
      let tb = new TransactionBuilder(account, u.opts())
      .addOperation(Operation.setOptions({
        masterWeight: body.signers[0].weight,
        lowThreshold: body.thresholds.low_threshold,
        medThreshold: body.thresholds.med_threshold,
        highThreshold: body.thresholds.high_threshold
      }))
      body.signers.shift()
      for (signer of body.signers) {
        tb = tb.addOperation(Operation.setOptions({ signer: signer }))
      }
      for (turret of body.turrets) {
        tb = tb.addOperation(Operation.manageData({
          name: `TSS_${turret[0]}`,
          value: turret[1]
        }))
      }
      let transaction = tb.build()
      transaction.sign(keys)
      return server.submitTransaction(transaction);
    })
    .then(result => `result ${JSON.stringify(result)}`)
    .catch(error => `error ${error}`)

    console.log('- ending checkSetup...')
    return out;
  }

exports.checkSetup = checkSetup
exports.manageTxSigners= manageTxSigners
exports.run = run
exports.upload = upload

function cost (txFunction, txFunctionFields) { // {{{1
  const txFunctionFieldsBuffer = Buffer.from(txFunctionFields, 'base64')
  const txFunctionBuffer = Buffer.from(txFunction)
  const txFunctionConcat = Buffer.concat([txFunctionBuffer, txFunctionFieldsBuffer])

  return new BigNumber(txFunctionConcat.length).dividedBy(UPLOAD_DIVISOR).toFixed(7)
}

async function fee (cost, turret, sponsorPubkey, sponsorPrvkey) { // {{{1
  try {
    const keys = Keypair.fromSecret(sponsorPrvkey)
    const transaction = await server.loadAccount(sponsorPubkey)
    .then(account => {
      const now = moment.utc().startOf('minute')
      const minTime = now.clone().startOf('month')
      const maxTime = minTime.clone().endOf('month')

      let transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        timebounds: {
          minTime: minTime.unix(),
          maxTime: maxTime.unix()
        },
        networkPassphrase: Networks[STELLAR_NETWORK]
      })
      .addOperation(Operation.payment({
        destination: turret,
        asset: XLM,
        amount:  cost
      }))
      .build()
      transaction.sign(keys)
      return transaction.toXDR();
    })
    return transaction;
  }
  catch(err) {
    throw err
  }
}
