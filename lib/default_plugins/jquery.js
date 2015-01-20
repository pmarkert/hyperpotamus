var _ = require("underscore");
var interpolate;
var cheerio = require("cheerio");

module.exports.name = "jquery";

module.exports.handles = function(action) {
	return _.isString(action.jquery);
}

module.exports.process = function(action, context, callback) {
        var err, compare, value;
	var $ = cheerio.load(context.body);
	var key = action.key;
debugger;
	var matches = $(action.jquery);
	if(action.count) {
		if(_.isNumber(action.count)) {
			compare = action.count;
		}
		else { // Assume _.isString for now. TODO - Error otherwise
			compare = parseInt(interpolate(action.count, context.session));
		}
		if(matches.length!==compare) {
			return callback("Expected count of matches did not match", compare, matches.length);
		}
	}
	if(action.capture) {
		for(var i=0; i<matches.length; i++) {
			element = matches[i];
			for(var key in action.capture) {
				element = $(element);
				var target = action.capture[key];
				var isArray = false;
				if(_.isArray(action.capture[key])) {
					isArray = true;
					target = target[0];
					// TODO - handling for array lengths!=1
				}
				if(!target || target==="html" || target==="outerHTML") value = element.toString();
				else if(target==="innerHTML") value = element.html();
				else if(target==="text") value = element.text();
				else if(target[0]==="@") value = element.attr(target.substring(1));
				else if(target==="val") value = element.val();
				if(isArray) {
					if(!_.isArray(context.session[key])) {
						context.session[key] = [];
					}
					context.session[key].push(value);
				}
				else {
					context.session[key] = value;
				}
			}
		};
	}
	callback(err, compare, value);
}

module.exports.connect = function(hyperpotamus) {
	interpolate = hyperpotamus.interpolate;
}
