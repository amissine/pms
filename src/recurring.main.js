import { Networks, Asset, BASE_FEE, Operation, TransactionBuilder, Server } from 'stellar-sdk'
import moment from 'moment'

const STELLAR_NETWORK = 'TESTNET'
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const server = new Server(HORIZON_URL)
const XLM = Asset.native()

export default async ({request}) => {
  const destAcct = request.destination
  const ran = `tss.${destAcct}.ran`
  try {
    const transaction = await server
    .loadAccount(request.source)
    .then(account => {
      const lastRanRaw = account.data_attr[ran]
      console.log(`- lastRanRaw ${lastRanRaw}`)
      const now = moment.utc().startOf('minute')
      const minTime = now.clone().startOf('month')
      const maxTime = minTime.clone().endOf('month')

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
        name: ran,
        value: now.unix().toString()
      }))
/* for (const signer of signers) {{{1
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
