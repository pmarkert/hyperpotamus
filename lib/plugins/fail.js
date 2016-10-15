module.exports.name = "fail";
module.exports.safe = true;

var logger = require("../logging").logger("hyperpotamus.plugins." + module.exports.name);

/* 
Purpose:
  Alias for boolean false.
  Explicitly forces a failure condition, optionally passing along an error message. 

Examples:
  fail: Failure message
=====
  false
*/

var _ = require("underscore");

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
	return { message : this.fail };
}
