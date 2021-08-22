const assert = require('assert');
const howLongTillLunch = require('..');
const umd = require('../dist/how-long-till-lunch.umd')
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

function test(hours, minutes, seconds, expected, fn) {
	now.setHours(hours);
	now.setMinutes(minutes);
	now.setSeconds(seconds);

	assert.equal(fn(...lunchtime), expected);
	console.log(`\u001B[32m✓\u001B[39m ${expected}`);
}

let lunchtime = [ 12, 30 ];
test(11, 30, 0, '1 hour', howLongTillLunch);
test(10, 30, 0, '2 hours', howLongTillLunch);
test(12, 25, 0, '5 minutes', howLongTillLunch);
test(12, 29, 15, '45 seconds', howLongTillLunch);
test(13, 30, 0, '23 hours', howLongTillLunch);

// some of us like an early lunch
lunchtime = [ 11, 0 ];
test(10, 30, 0, '30 minutes', howLongTillLunch);

///////////////////////////////////////////////////////////

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
