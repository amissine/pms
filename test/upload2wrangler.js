const fetch = require('node-fetch')
const BigNumber = require('bignumber.js')

console.log('- started upload')

const UPLOAD_DIVISOR = 1000

let fields = JSON.stringify([
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

const upload = async ({txFunction}) => {
  const txFbase64 = txFunction.toString('base64')
  const txF = encodeURI(txFbase64)
  //console.log(`- txF:\n${txF}`)
  const txFf = `${cost(txFbase64, fields64)}` 
  console.log(`- txFf:\n${txFf}\n`)

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

    err => console.log(
      err,
      "\n\tHave you started 'wrangler dev' in another terminal?\n"
    )
  )
}

exports.upload = upload

function cost (txFunction, txFunctionFields) {
  const txFunctionFieldsBuffer = Buffer.from(txFunctionFields, 'base64')
  const txFunctionBuffer = Buffer.from(txFunction)
  const txFunctionConcat = Buffer.concat([txFunctionBuffer, txFunctionFieldsBuffer])

  return new BigNumber(txFunctionConcat.length).dividedBy(UPLOAD_DIVISOR).toFixed(7)
}
