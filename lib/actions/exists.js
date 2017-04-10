module.exports.safe = true;

/*
 Purpose:
 Raises an error if a value has not been set in the session at the specified path/key.

 exists: "key"

 */

var _ = require("lodash");
var verror = require("verror");

module.exports.normalize = function normalize(action) {
	if (_.has(action, "is_set")) {
		if(_.has(action, "exists")) {
			throw new verror.VError({
				name: "InvalidActionValue.exists",
				info: {
					path: this.path + ".exists"
				}
			}, "Cannot specify both .exists and .is_set");
		}
		action.exists = action.is_set;
		delete(action.is_set);
		return action;
	}
}

module.exports.process = function process(context) {
	if(!_.isString(this.exists)) {
		throw new verror.VError({
			name: "InvalidActionValue.exists",
			info: {
				path: this.path + ".exists"
			}
		}, "Value of exists must be a string key/path to test.");
	}
	if(!_.has(context.session, this.exists)) {
		throw new verror.VError({
			name: "ValueNotSet",
			info: {
				key: this.exists,
				path: this.path + ".exists"
			}
		}, "The session value does not exist - " + this.exists);
	}
};
