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
	console.log(`\u001B[32m✓\u001B[39m ${title}`);
  fn(args)
  .then((res) =>  res && console.log(`- res ${res}`))
} // }}}1

const destAcct = 'GATQMXDGUTJNMGPZTEM3CAVUEHLMXIBM2M2DTSFYT7WYQZEGLU66RTYL'
// SBXT7FSAMYIKBWYMCXR5QLGSZT2JV3HA57JZ46PI3NZJE5IONT3RJMZF
const ctldAccount = 'GCEUWXG32WXLK3LXL3WWJ2RLXDQH44U4QIP2SIK4JIP45SDJNZFPYHSL'
// SBZHBA4WMASHNQDPFGTKVWEJCUH7X5CJOT2LNHWQYJGKSDBJG2OGLSXW

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

test("upload txFunction 'recurring' to turret3 Cloudflare Worker", RUN_TEST, //{{{1
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

test("manage ctldAccount's turrets", SKIP_TEST, // {{{1
  w.manageTxSigners,
  {
    body: {
      txFunctionHash: TX_FUNCTION_HASH,
      sourceAccount: ctldAccount,
      removeTurret: TURRET3_ADDRESS,
      addTurret: TURRET2_ADDRESS
    }
  }
)

test("run txFunction 'recurring' on tss-wrangler Cloudflare Worker", SKIP_TEST, // {{{1
  w.run,
  {
    txFunction: fs.readFileSync('./tx-functions/recurring.js'),
    turret: TURRET_ADDRESS,
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
