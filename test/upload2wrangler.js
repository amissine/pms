const fetch = require('node-fetch')
const BigNumber = require('bignumber.js')
const { Keypair, Networks, Asset, BASE_FEE, Operation, TransactionBuilder, Server } = require('stellar-sdk')
const moment = require('moment')

console.log('- started upload') // {{{1

const STELLAR_NETWORK = 'TESTNET'
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

  const txFbase64 = txFunction.toString('base64')
  const txF = encodeURI(txFbase64)
  let txFf
  try {
    txFf = await fee(
      cost(txFbase64, fields64), turret, sponsorPubkey, sponsorPrvkey
    )
  } catch(err) {
    console.log(err)
  }
  txFf = encodeURI(txFf)
  while (txFf.indexOf('+') > -1) {
    txFf = txFf.replace('+', '%2B')
  }

  fetch(
    'http://127.0.0.1:8787/tx-functions',
    { method: 'POST', 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },  
      body: `txFunctionFields=${fields}&txFunction=${txF}&txFunctionFee=${txFf}` 
    }
  )
  .then(
    res => res.json()
    .then(json => console.log(json)), 
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
    err => console.log(
      err,
      "\n\tHave you started 'wrangler dev' in another terminal?\n"
    )
  );
}

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
      transaction = transaction.toXDR()
//console.log(`- amount ${cost}\n- destination ${turret}\n- source ${sponsorPubkey}\n- minTime ${minTime.unix()}\n- maxTime ${maxTime.unix()}\n- sponsorPrvkey ${sponsorPrvkey}\n- transaction ${transaction}`)
      return transaction;
    })
    //transaction.sign(keys)
    return transaction;
  }
  catch(err) {
    throw err
  }
}
