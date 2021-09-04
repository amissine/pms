const fetch = require('node-fetch') // {{{1
const BigNumber = require('bignumber.js')
const { Account, xdr, Claimant, Keypair, Networks, Asset, BASE_FEE, Operation, TransactionBuilder, Server } = require('stellar-sdk')
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
    let txFf // {{{2
    try {
      txFf = await fee(cost(txFbase64, fields64), turret, sponsorPubkey, sponsorPrvkey)
    } catch(err) { return err; }
    txFf = encodeURI(txFf)
    while (txFf.indexOf('+') > -1) {
      txFf = txFf.replace('+', '%2B')
    } // }}}2

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
  async ({txFunctionHash, balanceId, sponsorPubkey, sponsorPrvkey}) => {
    console.log('- started run')

    let feeToken // {{{2
    try {
      feeToken = fee_token(Keypair.fromSecret(sponsorPrvkey), balanceId, txFunctionHash)
    } catch(err) { throw err; }

    console.log(`- feeToken ${feeToken}`)
    //feeToken = encodeURI(feeToken) // }}}2

    let out = await fetch(
      `http://127.0.0.1:8787/tx-functions/${txFunctionHash}`,
      { method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'authorization': feeToken
        },  
        body: `{"some":"json"}` 
      }
    )
    //.then(res => res.json().then(json => `json ${JSON.stringify(json)}`))
    .then(res => res.text().then(text => text))
    .catch(err => `err ${err}\n\tHave you started 'wrangler dev' in another terminal?\n`)
    console.log('- ending run...')
    return out;
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
      body.signers.shift() // {{{2
      for (signer of body.signers) {
        tb = tb.addOperation(Operation.setOptions({ signer: signer }))
      }
      for (turret of body.turrets) {
        tb = tb.addOperation(Operation.manageData({
          name: `TSS_${turret[0]}`,
          value: turret[1]
        }))
      } // }}}2
      let transaction = tb.build()
      transaction.sign(keys)
      return server.submitTransaction(transaction);
    })
    .then(result => `result ${JSON.stringify(result)}`)
    .catch(error => `error ${error}`)

    console.log('- ending checkSetup...')
    return out;
  }

const createClaimableBalance = // {{{1
  async ({ sponsorPrvkey, amount, claimants}) => {
    console.log(`- started createClaimableBalance`)

    const keys = Keypair.fromSecret(sponsorPrvkey)
    const predicate = Claimant.predicateUnconditional()
    let pairs = []
    for (claimant of claimants) {
      pairs.push(new Claimant(claimant, predicate))
    }
    claimants = pairs

    let out = await server.loadAccount(keys.publicKey())
    .then(account => {
      let transaction = new TransactionBuilder(account, u.opts())
      .addOperation(Operation.createClaimableBalance({
        asset: XLM,
        amount: amount,
        claimants: claimants
      }))
      .build()
      transaction.sign(keys)
      return server.submitTransaction(transaction);
    })
    .then(result => `result ${JSON.stringify(result)}`)
    .catch(error => `error ${error}`)

    console.log('- ending createClaimableBalance...')
    return out;
  }

const getClaimableBalanceId = // {{{1
  async ({ result_xdr }) => {
    console.log('- started getClaimableBalanceId')

    let txResult = xdr.TransactionResult.fromXDR(result_xdr, "base64");
    let results = txResult.result().results();

    // We look at the first result since our first (and only) operation
    // in the transaction was the CreateClaimableBalanceOp.
    let operationResult = results[0].value().createClaimableBalanceResult();
    let balanceId = operationResult.balanceId().toXDR("hex");

    let out = balanceId

    console.log('- ending getClaimableBalanceId...')
    return out;
  }

const createClaimableBalanceNoReclaim = // {{{1
  async ({ sponsorPrvkey, amount, claimants}) => {
    console.log('- started createClaimableBalanceNoReclaim')
    
    if (claimants.length > 1)
      throw 'No reclaim for now'

    const keys = Keypair.fromSecret(sponsorPrvkey)
    const predicate = Claimant.predicateUnconditional()
    claimants = [new Claimant(claimants[0], predicate)]

    let out = await server.loadAccount(keys.publicKey())
    .then(account => {
      let transaction = new TransactionBuilder(account, u.opts())
      .addOperation(Operation.createClaimableBalance({
        asset: XLM,
        amount: amount,
        claimants: claimants
      }))
      .build()
      transaction.sign(keys)
      return server.submitTransaction(transaction);
    })
    .then(result => {
      let result_xdr = result.result_xdr
      let txResult = xdr.TransactionResult.fromXDR(result_xdr, "base64")
      let results = txResult.result().results()
      let operationResult = results[0].value().createClaimableBalanceResult()
      let balanceId = operationResult.balanceId().toXDR("hex")
      return `\nresult ${JSON.stringify(result)}\nbalanceId ${balanceId}`;
    })
    .catch(error => `error ${error}`)

    console.log('- ending createClaimableBalanceNoReclaim...')
    return out;
  } // }}}1

exports.createClaimableBalanceNoReclaim = createClaimableBalanceNoReclaim
exports.getClaimableBalanceId = getClaimableBalanceId
exports.createClaimableBalance = createClaimableBalance
exports.checkSetup = checkSetup
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

function fee_token (keys, balanceId, txFunctionHash) { // {{{1
  let tx = new TransactionBuilder(new Account(keys.publicKey(), '-1'), u.opts())
  .addOperation(Operation.claimClaimableBalance({
    balanceId: balanceId
  }))
  .addOperation(Operation.manageData({
    name: 'txFunctionHash',
    value: txFunctionHash
  }))
  .build()
  tx.sign(keys)
  return tx.toXDR();
}
