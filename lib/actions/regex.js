module.exports.safe = true;

/*
Purpose:
  Validates (or captures content from) the HTTP response against a regular expression.
*/
var _ = require("lodash");
var verror = require("verror");
var regex_helper = require("./helpers/regex");

module.exports.normalize = function (action) {
	if (_.isRegExp(action)) {
		return { regex: regex_helper.convert_true_regex(action) };
	}
	else if (_.isString(action)) {
		var re = regex_helper.extract_regex(action);
		if (re) {
			return { regex: re };
		}
	}
	else if (_.has(action, "regex")) {
		if (_.isString(action.regex)) {
			action.regex = regex_helper.extract_regex(action.regex);
			return action;
		}
	}
};

module.exports.process = function (context) {
	if (!regex_helper.capture_validate(this.regex, context.body, context)) {
		throw new verror.VError({
			name: "BodyMismatch",
			info: {
				regex: this.regex.pattern, 
				body: context.body 
			}
		}, "Body did not match regex");
	}
};