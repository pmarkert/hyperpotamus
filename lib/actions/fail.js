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
	if (action === false) {
		return { fail: "Explicit false" };
	}
	if (_.has(action, "fail")) {
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

module.exports.process = function () {
	throw new verror.VError({
		name: "FailActionError",
		info: {
			message: this.fail,
			path: this.path + ".fail"
		}
	}, this.fail);
};
