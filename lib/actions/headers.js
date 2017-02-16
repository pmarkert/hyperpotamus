module.exports.safe = true;

/*
Purpose:
   Validates that one or more http headers match the text or regex expectations

Syntax:
  - headers:
     header-name1: /regex to match/
     header-name2: /regex to (?:capture)/
     header-name3: capture_key
*/

var _ = require("lodash");
var regex_helper = require("./helpers/regex");
var verror = require("verror");

module.exports.normalize = function (action) {
	if (_.has(action, "headers")) {
		for (var key in action.headers) {
			if (_.isRegExp(action.headers[key])) {
				action.headers[key] = { regex: regex_helper.convert_true_regex(action.headers[key]) };
			}
			else if (_.isString(action.headers[key])) {
				var re = regex_helper.extract_regex(action.headers[key]);
				if (re) {
					action.headers[key] = { regex: re };
				} else {
					action.headers[key] = { capture: action.headers[key] };
				}
			}
		}
		return action;
	}
};

module.exports.process = function (context) {
	var actual, expected;
	for (var key in this.headers) {
		actual = context.response.headers[key];
		if (this.headers[key].capture) {
			context.setSessionValue(this.headers[key].capture, actual);
		}
		if (this.headers[key].text) {
			expected = this.headers[key].text;
			if (expected !== actual) {
				throw new verror.VError({
					name: "HeaderMismatch.text",
					info: {
						path: `${this.path}.headers.${key}.text`,
						expected,
						actual
					}
				}, "Header " + key + " did not match text value");
			}
		}
		if (this.headers[key].regex) {
			expected = this.headers[key].regex;
			if (!regex_helper.capture_validate(this.headers[key].regex, actual, context)) {
				throw new verror.VError({
					name: "HeaderMismatch.regex",
					info: {
						path: `${this.path}.headers.${key}.regex`,
						expected,
						actual
					}
				}, "Header " + key + " did not match regex value");
			}
		}
	}
};
