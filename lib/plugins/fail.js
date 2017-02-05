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
var verror = require("verror");

module.exports.normalize = function (action, normalize_action, path) {
	if (_.isBoolean(action) && !action) {
		return { fail: "Explicit false" };
	}
	if (_.isObject(action) && _.has(action, "fail")) {
		if (!_.isString(action.fail)) {
			throw new verror.VError({ 
				name: "ActionStructureError.fail", 
				info: { 
					path: path + ".fail" 
				} 
			}, "Fail value, should be a string");
		}
		return action;
	}
};

// eslint-disable-next-line no-unused-vars
module.exports.process = function (context) {
	throw new verror.VError( { 
		name: "FailActionError", 
		info: { 
			message: this.fail,
			path: this.path + ".fail"
		} 
	}, this.fail);
};
