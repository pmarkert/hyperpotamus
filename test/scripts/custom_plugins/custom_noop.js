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
	if (!_.isNil(action.custom_noop)) {
		action.normalized = true;
		return action;
	}
};

// eslint-disable-next-line no-unused-vars
module.exports.process = function (context) {
	return;
};
