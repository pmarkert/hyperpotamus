module.exports.safe = true;

/*
Purpose:
  Alias for boolean true. Does not perform any function, except to pass along success.
  Primarily used for testing logical operators.

Normalization Shortcut:
  - true

Examples:
  noop: true
=====
  true
*/

var _ = require("lodash");

module.exports.normalize = function (action) {
	// true => { noop: true }
	if (_.isBoolean(action) && action == true) {
		return { noop: true };
	}
};

module.exports.process = function () {
	return;
};
