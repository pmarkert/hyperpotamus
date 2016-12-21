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

var _ = require("lodash");

module.exports.normalize = function (action) {
	if (_.isBoolean(action) && !action) {
		return { fail: "Explicit false" };
	}
}

module.exports.process = function (context) {
	throw { message: this.fail };
}
