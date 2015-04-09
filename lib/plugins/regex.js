var _ = require("underscore");
var regex_helper = require("./helpers/regex");

module.exports.name = "regex";

module.exports.safe = true;

module.exports.normalize = function(action) {
	if(_.isRegExp(action)) {
		return { regex : regex_helper.convert_true_regex(action) };
	}
	else if(_.isString(action)) {
		var re = regex_helper.extract_regex(action);
		if(re) return { regex : re };
	}
	else if(_.isObject(action) && _.isString(action.regex)) {
		action.regex = regex_helper.extract_regex(action.regex);
		return action;
	}
	return;
}

module.exports.handles = function(action) {
	return _.isObject(action.regex);
}

module.exports.process = function(context) {
	if(this.debugger) debugger;
	if(!regex_helper.capture_validate(this.regex, context.body, context.session)) {
		throw { message : "Body did not match regex", expected : this.regex.pattern, actual : context.body };
	};
}
