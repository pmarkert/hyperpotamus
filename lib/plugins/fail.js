var _ = require("underscore");

module.exports.name = "fail";
module.exports.safe = true;

/* 
Purpose:
  Alias for boolean false.
  Explicitly forces a failure condition, optionally passing along an error message. 

Examples:
  fail: Failure message
=====
  false
*/

module.exports = { 
	normalize: normalize,
	handles: handles,
	process: process
}

function normalize(action) {
	if(_.isBoolean(action) && !action) {
		return { fail : "Explicit false" };
	}
}

function handles(action) {
	return _.isString(action.fail);
}

function process(context) {
	if(this.debugger) debugger;
	return { message : this.fail };
}
