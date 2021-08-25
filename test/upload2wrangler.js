const fetch = require('node-fetch')

console.log('- started upload')

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
fields = Buffer.alloc(fields.length, fields).toString('base64')
fields = encodeURI(fields)
//console.log(`- fields:\n${fields}`)

const txFf = ''
console.log(`- txFf:\n${txFf}`)

const upload = async ({txFunction}) => {
  const txF = encodeURI(txFunction.toString('base64'))
  //console.log(`- txF:\n${txF}`)
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
