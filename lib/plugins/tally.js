var _ = require("underscore");

module.exports.name = "tally";
module.exports.safe = true;

/* 
Purpose:
  Provides a way to count/tally the number of occurrences of a set of values. The result is a hash
  with each key and the number of times the key was tallied.
  key: The key of the tally/report object where results are accumulated.
  value: The value to increment in the tally. If the value is an array, each element of the array will be tallied.

Examples:
  # domains = [ 'a', 'b', 'b', 'a', 'c' ]
  tally:
    key: report
    value_key: domains
  # report:  { 'a' : 2, 'b' : 2, 'c' : 1 }
*/

module.exports = { 
	handles: handles,
	process: process
}

function handles(action) {
	return _.isObject(action.tally);
}

function process(context) {
	if(!_.isString(this.tally.key)) {
		throw new { message : "tally.key must be set" };
	}
	var report = context.session[this.tally.key];
	if(!report) { 
		report = {};
		context.session[this.tally.key] = report;
	}
	var value;
	if(_.isString(this.tally.value_key)) {
		value = context.session[this.tally.value_key];
	}
	else if(_.isString(this.tally.value)) {
		value = this.tally.value;
	}
	else {
		throw new { message : "tally.value or tally.value_key must be set" };
	}
	if(_.isArray(value)) {
		for(var i=0;i<value.length;i++) {
			tally(value[i], report);
		}
	}
	else {
		tally(value, report);
	}
}

function tally(value, report) {
	if(!report[value]) {
		report[value] = 1;
	}
	else {
		report[value]++;
	}
}
