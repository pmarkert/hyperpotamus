var _ = require("underscore");

module.exports.name = "noop";
module.exports.safe = true;

/* 
Purpose:
  Alias for boolean true.
  Does not perform any function, except to pass along succeess.
  Primarily used for testing logical operators.

Examples:
  noop: true
=====
  true
*/

module.exports = { 
	normalize: normalize,
	handles: handles,
	process: process
}

function normalize(action) {
	// true => { noop: true }
	if(_.isBoolean(action) && action==true) {
		return { noop: true };
	}
}

function handles(action) {
	return !_.isUndefined(action.noop);
}

function process(context) {
	if(this.debugger) debugger;
	return;
}
