var named = require("named-regexp").named;
var _ = require("underscore");
var regex_helper = require("./helpers/regex");

module.exports.name = "headers";

module.exports.safe = true;

/**
 * Validates that one or more http headers match the text or regex expectations
 * - headers:
 *    header-name1: /regex to match/
 *    header-name2: /regex to (?:capture)/
 *    header-name3: capture_key
 */


module.exports.normalize = function(action) {
	if(_.isObject(action.headers)) {
		for(var key in action.headers) {
			if(_.isRegExp(action.headers[key])) {
				action.headers[key] = { regex : regex_helper.convert_true_regex(action.headers[key]) };
			}
			else if(_.isString(action.headers[key])) {
				var re = regex_helper.extract_regex(action.headers[key]);
				if(re) action.headers[key] = { regex : re };
				else action.headers[key] = { capture : action.headers[key] };
			}
		}
		return action;
	}
}

module.exports.handles = function(action) {
	return _.isObject(action.headers);
}

module.exports.process = function(context) {
	if(this.debugger) debugger;
	var err, actual, expected;
	for(var key in this.headers) {
		actual = context.response.headers[key];
		if(this.headers[key].capture) {
			context.session[this.headers[key].capture] = actual;
		}
		if(this.headers[key].text) {
			expected = this.headers[key].text;
			if(expected !== actual) {
				return { message : "Header " + key + " did not match text value", expected : expected, actual : actual };
			}
		}
		if(this.headers[key].regex) {
			expected = this.headers[key].regex;
			if(!regex_helper.capture_validate(this.headers[key].regex, actual, context.session)) {
				return { message : "Header " + key + " did not match regex value", expected : expected, actual : actual };
			}
		}
	}
}
