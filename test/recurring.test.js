const assert = require('assert'); // {{{1
const recurring = require('..');
const w = require('./wrangler')
const fs = require('fs')
//const recurringConfig = require('./recurring.config')

//const rc = recurringConfig.init()
//console.log(`- rc ${JSON.stringify(rc)}`)

/* global.Date = MockDate {{{1
function MockDate () {
	this.date = 0;
	this.hours = 0;
	this.minutes = 0;
	this.seconds = 0;
	this.milliseconds = 0;
};

Object.assign(MockDate.prototype, {
	getDate () { return this.date; },
	setDate (date) { this.date = date; },
	setHours (h) { this.hours = h; },
	setMinutes (m) { this.minutes = m; },
	setSeconds (s) { this.seconds = s; },
	setMilliseconds (ms) { this.milliseconds = ms; },
	valueOf () {
		return (
			this.milliseconds +
			this.seconds * 1e3 +
			this.minutes * 1e3 * 60 +
			this.hours * 1e3 * 60 * 60 +
			this.date * 1e3 * 60 * 60 * 24
		);
	}
});

const now = new MockDate();
MockDate.now = () => now.valueOf();

global.Date = MockDate;
}}}1 */

const RUN_TEST  = false
const SKIP_TEST = true

function test(title, skip, fn, args) { // {{{1
  if (skip) {
    return;
  }
	console.log(`\u001B[32m⚠️ \u001B[39m ${title}`);
  fn(args)
  .catch(err => console.error(err))
  .then((res) =>  res && console.log(`- res ${res}`))
} // }}}1

const destAcct = 'GATQMXDGUTJNMGPZTEM3CAVUEHLMXIBM2M2DTSFYT7WYQZEGLU66RTYL'
// SBXT7FSAMYIKBWYMCXR5QLGSZT2JV3HA57JZ46PI3NZJE5IONT3RJMZF
const ctldAccount = 'GCEUWXG32WXLK3LXL3WWJ2RLXDQH44U4QIP2SIK4JIP45SDJNZFPYHSL'
const secret = 'SBZHBA4WMASHNQDPFGTKVWEJCUH7X5CJOT2LNHWQYJGKSDBJG2OGLSXW'

test('recurring monthly payment from ctldAccount to destAcct', SKIP_TEST, // {{{1
  recurring,
  {
    request: {
      destination: destAcct,
      source: ctldAccount
    },
  }
) // }}}1

const TURRET_ADDRESS = "GB5PBJ524NP3UV2EXDEPIECIG6Y4TWVLPTJ3H6E63KVMYZAPDOA42FYG"
const SPONSOR_PUBKEY = 'GBWFDT2ALGVTR5QCD647CMGDBSWUHTNYAORBVIDIFK656BFTKYEAMH7O'
const SPONSOR_PRVKEY = 'SB5QXDTF7DZCAWSGITUIYGIO627K5M7K44KFHMCVOBPXQAR7IED6K4MN'

const TURRET2_ADDRESS = 'GBO6KISYZUXIYWCXFYG24X3FGEPCLCFQ5H4ZSDSXIDSMM3NCCRTSWIVT'
const TURRET2_PRVKEY  = 'SAZFN236J2HFDD6MNXNAKOGU7OUXFU2G6Q26ZI2Z5WVQLSEGWEHTJUN2'

const TURRET3_ADDRESS = 'GATRGRWZJNVL4N47FO646B23CF5TZPTHTFSU5TG7QXF6HR4MSGBAILTT'
const TURRET3_PRVKEY  = 'SCXUZTFYJSXBZI64YJNEOP55G7SXC2RW4MNH22SLWFVTWTY2KA2JOIO3'

test("upload txFunction 'recurring' to tss-wrangler Cloudflare Worker", SKIP_TEST,//{{{1
  w.upload,
  {
    txFunction: fs.readFileSync('./tx-functions/recurring.js'),
    turret: TURRET_ADDRESS,
    sponsorPubkey: SPONSOR_PUBKEY,
    sponsorPrvkey: SPONSOR_PRVKEY
  }
)

test("upload txFunction 'recurring' to turret2 Cloudflare Worker", SKIP_TEST, //{{{1
  w.upload,
  {
    txFunction: fs.readFileSync('./tx-functions/recurring.js'),
    turret: TURRET2_ADDRESS,
    sponsorPubkey: SPONSOR_PUBKEY,
    sponsorPrvkey: SPONSOR_PRVKEY
  }
) 
// - res {"hash":"0d3d194d85de8265f7979a43a7d53af2ea00561d07e07868f4149c448c0d0fe7","signer":"GBIRNQMUMW3QNIVQWK2J6CYCKLJ4RTKF53WJCQQFRBFGTSOJODRVOC7O"} 

test("upload txFunction 'recurring' to turret3 Cloudflare Worker", SKIP_TEST, //{{{1
  w.upload,
  {
    txFunction: fs.readFileSync('./tx-functions/recurring.js'),
    turret: TURRET3_ADDRESS,
    sponsorPubkey: SPONSOR_PUBKEY,
    sponsorPrvkey: SPONSOR_PRVKEY
  }
) 
// - res {"hash":"0d3d194d85de8265f7979a43a7d53af2ea00561d07e07868f4149c448c0d0fe7","signer":"GBF7AKPZINKTXMIWITUDVVGQ76XZIHJN2R3MCZJJDSNFASTRF6B56R63"} }}}1

const TX_FUNCTION_HASH = '0d3d194d85de8265f7979a43a7d53af2ea00561d07e07868f4149c448c0d0fe7'
const TURRET1_SIGNER = 'GBDU6GV5AZTZVFUGMIZDN7HKEYEOMC5WHKN5AVJPQVZSBFWH3Y4RNILN'
const TURRET2_SIGNER = 'GBIRNQMUMW3QNIVQWK2J6CYCKLJ4RTKF53WJCQQFRBFGTSOJODRVOC7O'
const TURRET3_SIGNER = 'GBF7AKPZINKTXMIWITUDVVGQ76XZIHJN2R3MCZJJDSNFASTRF6B56R63'

test("check ctldAccount's setup", SKIP_TEST, // {{{1
  w.checkSetup,
  {
    body: {
      sourceAccount: ctldAccount, secret: secret,
      thresholds: {
        low_threshold: 2,
        med_threshold: 3,
        high_threshold: 4
      },
      signers: [
        { weight: 4 },
        { weight: 1, ed25519PublicKey: TURRET1_SIGNER },
        { weight: 1, ed25519PublicKey: TURRET2_SIGNER },
        { weight: 1, ed25519PublicKey: TURRET3_SIGNER }
      ],
      turrets: [
        [TURRET_ADDRESS, TURRET1_SIGNER],
        [TURRET2_ADDRESS, TURRET2_SIGNER],
        [TURRET3_ADDRESS, TURRET3_SIGNER]
      ]
    }
  }
)

test("3) create Claimable Balance for all turrets", SKIP_TEST, //{{{1
  w.createClaimableBalance,
  {
    sponsorPrvkey: SPONSOR_PRVKEY,
    amount: '60', // XLM
    claimants: [TURRET_ADDRESS, TURRET2_ADDRESS, TURRET3_ADDRESS]
  }
) 
/* {{{2
- res result {"_links":{"self":{"href":"https://horizon-testnet.stellar.org/transactions/83791a9e2f8f760dec17f6671b5b339f0d058c24205ed660c22def2d7ce916c9"},"account":{"href":"https://horizon-testnet.stellar.org/accounts/GBWFDT2ALGVTR5QCD647CMGDBSWUHTNYAORBVIDIFK656BFTKYEAMH7O"},"ledger":{"href":"https://horizon-testnet.stellar.org/ledgers/1291512"},"operations":{"href":"https://horizon-testnet.stellar.org/transactions/83791a9e2f8f760dec17f6671b5b339f0d058c24205ed660c22def2d7ce916c9/operations{?cursor,limit,order}","templated":true},"effects":{"href":"https://horizon-testnet.stellar.org/transactions/83791a9e2f8f760dec17f6671b5b339f0d058c24205ed660c22def2d7ce916c9/effects{?cursor,limit,order}","templated":true},"precedes":{"href":"https://horizon-testnet.stellar.org/transactions?order=asc&cursor=5547001802395648"},"succeeds":{"href":"https://horizon-testnet.stellar.org/transactions?order=desc&cursor=5547001802395648"},"transaction":{"href":"https://horizon-testnet.stellar.org/transactions/83791a9e2f8f760dec17f6671b5b339f0d058c24205ed660c22def2d7ce916c9"}},"id":"83791a9e2f8f760dec17f6671b5b339f0d058c24205ed660c22def2d7ce916c9","paging_token":"5547001802395648","successful":true,"hash":"83791a9e2f8f760dec17f6671b5b339f0d058c24205ed660c22def2d7ce916c9","ledger":1291512,"created_at":"2021-09-02T22:37:54Z","source_account":"GBWFDT2ALGVTR5QCD647CMGDBSWUHTNYAORBVIDIFK656BFTKYEAMH7O","source_account_sequence":"5031524122492933","fee_account":"GBWFDT2ALGVTR5QCD647CMGDBSWUHTNYAORBVIDIFK656BFTKYEAMH7O","fee_charged":"100","max_fee":"100","operation_count":1,"envelope_xdr":"AAAAAgAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAAGQAEeAlAAAABQAAAAEAAAAAYS7CgAAAAABhVk9/AAAAAAAAAAEAAAAAAAAADgAAAAAAAAAAI8NGAAAAAAMAAAAAAAAAAHrwp7rjX7pXRLjI9BBIN7HJ2qt807P4ntqqzGQPG4HNAAAAAAAAAAAAAAAAXeUiWM0ujFhXLg2uX2UxHiWIsOn5mQ5XQOTGbaIUZysAAAAAAAAAAAAAAAAnE0bZS2q+N58rvc8HWxF7PL5nmWVOzN+Fy+PHjJGCBAAAAAAAAAAAAAAAAbNWCAYAAABAjKnLalOlWEi+nJlThIVmadwwSiMcWfEVDnVERua4kBkWBUF3HsFQrSVX6Yl8q46qFy7jUPmyDwdayqeU0SlvCQ==","result_xdr":"AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAOAAAAAAAAAAB1QOe/BEA3IDUmDr4xhnC0ad5kKSRasGhVK8dwzJ6pwAAAAAA=","result_meta_xdr":"AAAAAgAAAAIAAAADABO0+AAAAAAAAAAAbFHPQFmrOPYCH7nxMMMMrUPNuAOiGqBoKr3fBLNWCAYAAAAXPVNWDAAR4CUAAAAEAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABABO0+AAAAAAAAAAAbFHPQFmrOPYCH7nxMMMMrUPNuAOiGqBoKr3fBLNWCAYAAAAXPVNWDAAR4CUAAAAFAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAwAAAAMAE7T4AAAAAAAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAABc9U1YMABHgJQAAAAUAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAE7T4AAAAAAAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAABcZkBAMABHgJQAAAAUAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAE7T4AAAABAAAAAB1QOe/BEA3IDUmDr4xhnC0ad5kKSRasGhVK8dwzJ6pwAAAAAMAAAAAAAAAAHrwp7rjX7pXRLjI9BBIN7HJ2qt807P4ntqqzGQPG4HNAAAAAAAAAAAAAAAAXeUiWM0ujFhXLg2uX2UxHiWIsOn5mQ5XQOTGbaIUZysAAAAAAAAAAAAAAAAnE0bZS2q+N58rvc8HWxF7PL5nmWVOzN+Fy+PHjJGCBAAAAAAAAAAAAAAAACPDRgAAAAAAAAAAAQAAAAEAAAAAbFHPQFmrOPYCH7nxMMMMrUPNuAOiGqBoKr3fBLNWCAYAAAAAAAAAAA==","fee_meta_xdr":"AAAAAgAAAAMAEvIMAAAAAAAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAABc9U1ZwABHgJQAAAAQAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAE7T4AAAAAAAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAABc9U1YMABHgJQAAAAQAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAQAAAAAAAAAAAAAAAA==","memo_type":"none","signatures":["jKnLalOlWEi+nJlThIVmadwwSiMcWfEVDnVERua4kBkWBUF3HsFQrSVX6Yl8q46qFy7jUPmyDwdayqeU0SlvCQ=="],"valid_after":"2021-09-01T00:00:00Z","valid_before":"2021-09-30T23:59:59Z"}
}}}2 */

test("3) get Claimable Balance Id", SKIP_TEST, //{{{1
  w.getClaimableBalanceId,
  {
    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAOAAAAAAAAAAB1QOe/BEA3IDUmDr4xhnC0ad5kKSRasGhVK8dwzJ6pwAAAAAA='
  }
)
//- res 000000007540e7bf0440372035260ebe318670b469de6429245ab068552bc770cc9ea9c0

test("3) create Claimable Balance for the turret (no reclaim), get Id", SKIP_TEST, //{{{1
  w.createClaimableBalanceNoReclaim,
  {
    sponsorPrvkey: SPONSOR_PRVKEY,
    amount: '8', // XLM
    claimants: [TURRET_ADDRESS]
  }
)
/* result, balanceId {{{2
result {"_links":{"self":{"href":"https://horizon-testnet.stellar.org/transactions/2d2576844047433f4e0e731920e07277db76ec5698e71b4f0e46416ff566b701"},"account":{"href":"https://horizon-testnet.stellar.org/accounts/GBWFDT2ALGVTR5QCD647CMGDBSWUHTNYAORBVIDIFK656BFTKYEAMH7O"},"ledger":{"href":"https://horizon-testnet.stellar.org/ledgers/1304188"},"operations":{"href":"https://horizon-testnet.stellar.org/transactions/2d2576844047433f4e0e731920e07277db76ec5698e71b4f0e46416ff566b701/operations{?cursor,limit,order}","templated":true},"effects":{"href":"https://horizon-testnet.stellar.org/transactions/2d2576844047433f4e0e731920e07277db76ec5698e71b4f0e46416ff566b701/effects{?cursor,limit,order}","templated":true},"precedes":{"href":"https://horizon-testnet.stellar.org/transactions?order=asc&cursor=5601444807839744"},"succeeds":{"href":"https://horizon-testnet.stellar.org/transactions?order=desc&cursor=5601444807839744"},"transaction":{"href":"https://horizon-testnet.stellar.org/transactions/2d2576844047433f4e0e731920e07277db76ec5698e71b4f0e46416ff566b701"}},"id":"2d2576844047433f4e0e731920e07277db76ec5698e71b4f0e46416ff566b701","paging_token":"5601444807839744","successful":true,"hash":"2d2576844047433f4e0e731920e07277db76ec5698e71b4f0e46416ff566b701","ledger":1304188,"created_at":"2021-09-03T17:06:05Z","source_account":"GBWFDT2ALGVTR5QCD647CMGDBSWUHTNYAORBVIDIFK656BFTKYEAMH7O","source_account_sequence":"5031524122492934","fee_account":"GBWFDT2ALGVTR5QCD647CMGDBSWUHTNYAORBVIDIFK656BFTKYEAMH7O","fee_charged":"100","max_fee":"100","operation_count":1,"envelope_xdr":"AAAAAgAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAAGQAEeAlAAAABgAAAAEAAAAAYS7CgAAAAABhVk9/AAAAAAAAAAEAAAAAAAAADgAAAAAAAAAAI8NGAAAAAAEAAAAAAAAAAHrwp7rjX7pXRLjI9BBIN7HJ2qt807P4ntqqzGQPG4HNAAAAAAAAAAAAAAABs1YIBgAAAEC6fiQDvv60DQagxoUNNPdLI+C87VGpJuk39dUdnKRj2UzxKKZgaoJ32Xlfm8KtwWzkJF8v/rR0EbqiTq8k6wQM","result_xdr":"AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAAOAAAAAAAAAABsUhMMkbrl5jxr0zG2VOW/IFg/m70+iBjHU90XLMK3AAAAAAA=","result_meta_xdr":"AAAAAgAAAAIAAAADABPmfAAAAAAAAAAAbFHPQFmrOPYCH7nxMMMMrUPNuAOiGqBoKr3fBLNWCAYAAAAXGZAPqAAR4CUAAAAFAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAABABPmfAAAAAAAAAAAbFHPQFmrOPYCH7nxMMMMrUPNuAOiGqBoKr3fBLNWCAYAAAAXGZAPqAAR4CUAAAAGAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAABAAAAAwAAAAMAE+Z8AAAAAAAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAABcZkA+oABHgJQAAAAYAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAEAE+Z8AAAAAAAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAABb1zMmoABHgJQAAAAYAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAE+Z8AAAABAAAAABsUhMMkbrl5jxr0zG2VOW/IFg/m70+iBjHU90XLMK3AAAAAAEAAAAAAAAAAHrwp7rjX7pXRLjI9BBIN7HJ2qt807P4ntqqzGQPG4HNAAAAAAAAAAAAAAAAI8NGAAAAAAAAAAABAAAAAQAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAAAAAAAAA","fee_meta_xdr":"AAAAAgAAAAMAE7T4AAAAAAAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAABcZkBAMABHgJQAAAAUAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAEAE+Z8AAAAAAAAAABsUc9AWas49gIfufEwwwytQ824A6IaoGgqvd8Es1YIBgAAABcZkA+oABHgJQAAAAUAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAABAAAAAAAAAAAAAAAAA==","memo_type":"none","signatures":["un4kA77+tA0GoMaFDTT3SyPgvO1RqSbpN/XVHZykY9lM8SimYGqCd9l5X5vCrcFs5CRfL/60dBG6ok6vJOsEDA=="],"valid_after":"2021-09-01T00:00:00Z","valid_before":"2021-09-30T23:59:59Z"}
balanceId 000000006c52130c91bae5e63c6bd331b654e5bf20583f9bbd3e8818c753dd172cc2b700
}}}2 */

test("run txFunction 'recurring' on tss-wrangler Cloudflare Worker", RUN_TEST, // {{{1
  w.run,
  {
    txFunctionHash: TX_FUNCTION_HASH,
    balanceId: '00000000f75c3cab3d70f9291ff53d4998b1a00b872ae7f44503d66ae100964af970e382',
    sponsorPubkey: SPONSOR_PUBKEY,
    sponsorPrvkey: SPONSOR_PRVKEY
  }
)

/* dynamic require {{{1
try {
  const umd = fs.readFileSync('./dist/how-long-till-lunch.umd.js')
  const tmpfile = './test/testdata.str'
  fs.writeFileSync(tmpfile, umd)
  const str = fs.readFileSync(tmpfile)
  console.log(`\n- str:\n${str}`)
} catch (err) {
  console.error(err)
}

const fn = require('./testdata.str')
console.log(`\n- fn:\n${fn.toString()}`)

lunchtime = [ 12, 30 ]
test(10, 30, 0, '2 hours', fn)
}}}1 */
