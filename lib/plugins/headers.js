var named = require("named-regexp").named;
var _ = require("underscore");
var regex_helper = require("./helpers/regex");

module.exports.name = "headers";

module.exports.safe = true;

module.exports.normalize = function(action) {
	if(_.isObject(action.headers)) {
		for(var key in action.headers) {
			if(_.isRegExp(action.headers[key])) {
				action.headers[key] = { regex : regex_helper.convert_true_regex(action.headers[key]) };
			}
			else if(_.isString(action.headers[key])) {
				var re = regex_helper.extract_regex(action.headers[key]);
				if(re) action.headers[key] = { regex : re };
				else action.headers[key] = { text : action.headers[key] };
			}
		}
		return action;
	}
}

module.exports.handles = function(action) {
	return _.isObject(action.headers);
}

module.exports.process = function(action, context, callback) {
	if(action.debugger) debugger;
        var err, value, compare;
        for(var key in action.headers) {
                if(key == "on_success" || key == "on_failure") continue;
                value = context.response.headers[key];
                if(action.headers[key].text) {
                        compare = action.headers[key].text;
                        if(compare !== value) {
                                err = "Header " + key + " did not match text value";
                                break;
                        }
                }
                if(action.headers[key].regex) {
                        compare = action.headers[key].regex;
                        if(!regex_helper.capture_validate(action.headers[key].regex, value, context.session)) {
                                err = "Header " + key + " did not match regex value";
                                break;
                        }
                }
        }
        return callback(err, compare, value);
}
