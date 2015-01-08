var interpolate = require("../interpolate");
var named = require("named-regexp").named;
var _ = require("underscore");

module.exports.name = "regex";

function regex_capturevalidate(regex, value_to_match, session) {
	var matched = named(new RegExp(interpolate(regex.pattern, session), regex.options)).exec(value_to_match);
	if(matched) {
		for(var key in matched.captures) {
			session[key] = matched.captures[key];
			if(session[key].length==1) {
				session[key] = session[key][0];
			}
		}
	}
	return matched!=null;
}

function validate_regexp(context, callback) {
	var err;
	if(!regex_capturevalidate(context.validation.regex, context.body, context.session)) {
		err = "Body did not match regex";
	};
	return callback(err, context.validation.regex, context.body);
}

function validate_true_regexp(context, callback) {
	var err;
	var re = { pattern : context.validation.source, options : "" };
	if(context.validation.global) re.options += "g";
	if(context.validation.ignoreCase) re.options += "i";
	if(context.validation.multiline) re.options += "m";
	if(!regex_capturevalidate(re, context.body, context.session)) {
		err = "Body did not match regex";
	};
	return callback(err, re, context.body);
}

module.exports.handles = function(validation) {
	return _.isRegExp(validation) || !!validation.regex;
}

module.exports.validate = function(context, callback) {
	if(_.isRegExp(context.validation)) return validate_true_regexp(context, callback);
	else if(context.validation.regex) return validate_regexp(context, callback);
}
