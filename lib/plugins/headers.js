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

module.exports.process = function(context) {
	if(this.debugger) debugger;
        var err, actual, expected;
        for(var key in this.headers) {
                if(key == "on_success" || key == "on_failure") continue;
                actual = context.response.headers[key];
                if(this.headers[key].text) {
                        expected = this.headers[key].text;
                        if(expected !== actual) {
                                throw { message : "Header " + key + " did not match text value", expected : expected, actual : actual };
                        }
                }
                if(this.headers[key].regex) {
                        expected = this.headers[key].regex;
                        if(!regex_helper.capture_validate(this.headers[key].regex, actual, context.session)) {
                                throw { message : "Header " + key + " did not match regex value", expected : expected, actual : actual };
                        }
                }
        }
}
