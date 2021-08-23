import { Networks, Asset, BASE_FEE, Operation, TransactionBuilder, Server } from 'stellar-sdk'
import moment from 'moment'

const STELLAR_NETWORK = 'TESTNET'
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const server = new Server(HORIZON_URL)
const XLM = Asset.native()

async function contract({request, signers}) {
  const destAcct = request.destination
  try {
    const transaction = await server
    .loadAccount(request.source)
    .then((account) => {
      const now = moment.utc().startOf('minute')
      const minTime = now.clone().startOf('month')
      const maxTime = minTime.clone().endOf('month')

      const lastRanRaw = account.data_attr[`tss.${destAcct}.ran`]

      if (lastRanRaw) {
        const lastRanParsed = Buffer.from(lastRanRaw, 'base64').toString('utf8')
        const lastRanDate = moment.utc(lastRanParsed, 'X')

        if (lastRanDate.startOf('month').isSame(minTime, 'month'))
          throw `It hasn't been a month since the last run`
      }

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        timebounds: {
          minTime: minTime.unix(),
          maxTime: maxTime.unix()
        },
        networkPassphrase: Networks[STELLAR_NETWORK]
      })
      .addOperation(Operation.payment({
        destination: destAcct,
        asset: XLM,
        amount: '1000'
      }))
      .addOperation(Operation.manageData({
        name: `tss.${destAcct}.ran`,
        value: now.unix().toString()
      }))
/* {{{1
      for (const signer of signers) {
        transaction.addOperation(Operation.payment({
          destination: signer.turret,
          amount: signer.fee,
          asset: XLM
        }))
      }
}}}1 */
      return transaction
    })

    return transaction.build().toXDR()
  }

  catch(err) {
    throw err
  }
}

export default contract
