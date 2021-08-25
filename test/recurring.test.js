const assert = require('assert');
const recurring = require('..');
const upload = require('./upload2wrangler')
const fs = require('fs')

/* global.Date = MockDate {{{1
const fs = require('fs')

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
function test(title, skip, fn, args) {
  if (skip) {
    return;
  }
  fn(args)
  .then((res) => console.log(`- res ${res}`))
  .catch((err) => console.error(`- err ${err}`))

	console.log(`\u001B[32m✓\u001B[39m ${title}`);
}

const destAcct = 'GATQMXDGUTJNMGPZTEM3CAVUEHLMXIBM2M2DTSFYT7WYQZEGLU66RTYL'
// SBXT7FSAMYIKBWYMCXR5QLGSZT2JV3HA57JZ46PI3NZJE5IONT3RJMZF
const ctldAccount = 'GCEUWXG32WXLK3LXL3WWJ2RLXDQH44U4QIP2SIK4JIP45SDJNZFPYHSL'
// SBZHBA4WMASHNQDPFGTKVWEJCUH7X5CJOT2LNHWQYJGKSDBJG2OGLSXW

test('recurring monthly payment from ctldAccount to destAcct', true,
  recurring,
  {
    request: {
      destination: destAcct,
      source: ctldAccount
    },
  }
)

test('upload txFunction to tss-wrangler Cloudflare Worker', false,
  upload,
  {
    txFunction: encodeURI(fs.readFileSync('./tx-functions/recurring.js')),
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
