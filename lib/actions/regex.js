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
	else if (_.has(action, "regex")) {
		if (_.isString(action.regex)) {
			action.regex = regex_helper.extract_regex(action.regex);
			return action;
		}
	}
};

module.exports.process = function (context) {
	var target = this.target;
	if(_.isNil(target)) {
		var response = context.getSessionValue("hyperpotamus.response", null, undefined);
		if (_.isNil(response)) {
			throw new verror.VError({
				name: "InvalidActionPlacement.regex",
				info: {
					path: this.path + ".regex"
				}
			}, "If the regex action is not used within the .response of a request action, then an explicit .target must be specified.");
		}
		target = response.body;
	}
	if (_.isNil(target)) {
		throw new verror.VError({
			name: "TargetIsNull",
			info: {
				path: this.path + ".target"
			}
		}, "The target value is null");
	}
	target = target.toString();
	if (!regex_helper.capture_validate(this.regex, target, context)) {
		throw new verror.VError({
			name: "BodyMismatch",
			info: {
				regex: this.regex,
				target
			}
		}, "Target did not match regex");
	}
};
