module.exports.safe = true;

/*
Purpose:
  Set context values only if they are not already set. Useful for providing overrideable default values.

Example:
  - defaults:
     key1: value1
     key2: value2
*/

var _ = require("lodash");

module.exports.process = function (context) {
	for (var key in this.defaults) {
		if (!_.has(context.session, key)) {
			context.session[key] = this.defaults[key];
		}
	}
}
