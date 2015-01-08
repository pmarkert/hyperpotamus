var interpolate = require("../interpolate");
var named = require("named-regexp").named;
var _ = require("underscore");

module.exports.name = "headers";

module.exports.handles = function(validation) {
	return !!(validation.headers);
}

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

module.exports.process = function(context, callback) {
        var err, value;
        for(var key in context.validation.headers) {
                if(key == "on_success" || key == "on_failure") continue;
                value = context.response.headers[key];
                if(context.validation.headers[key].text) {
                        compare = interpolate(context.validation.headers[key].text);
                        if(compare !== value) {
                                err = "Header " + key + " did not match text value";
                                break;
                        }
                }
                if(context.validation.headers[key].regex) {
                        compare = context.validation.headers[key].regex;
                        if(!regex_capturevalidate(context.validation.headers[key].regex, value, context.session)) {
                                err = "Header " + key + " did not match regex value";
                                break;
                        }
                }
        }
        return callback(err, compare, value);
}
