module.exports.safe = true;

/*
 Purpose:
 Raises an error if the value specified by the session is not null or undefined.

 is_null: "key"

 Alias: is_nul

 */

var _ = require("lodash");
var verror = require("verror");

module.exports.normalize = function normalize(action) {
	if (_.has(action, "is_nil")) {
		if(_.has(action, "is_null")) {
			throw new verror.VError({
				name: "ActionStructureError.is_null",
				info: {
					path: this.path + ".is_null"
				}
			}, "Cannot specify both .is_null and .is_nil");
		}
		action.is_null = action.is_nil;
		delete(action.is_nil);
		return action;
	}
	if(_.has(action, "is_null")) {
		return action;
	}
}

module.exports.process = function process(context) {
	if(!_.isString(this.is_null)) {
		throw new verror.VError({
			name: "InvalidActionValue.is_null",
			info: {
				path: this.path + ".is_null"
			}
		}, "Value of is_null must be a string key/path to test.");
	}
	if(!_.isNil(_.get(context.session, this.is_null))) {
		throw new verror.VError({
			name: "ValueIsNotNull",
			info: {
				key: this.is_null,
				path: this.path + ".is_null"
			}
		}, "The session value is not null or undefined - " + this.is_null);
	}
};
