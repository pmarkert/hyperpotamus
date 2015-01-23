var _ = require("underscore");
var cheerio = require("cheerio");

module.exports.name = "jquery";

module.exports.handles = function(action) {
	return _.isString(action.jquery);
}

module.exports.process = function(action, context, callback) {
        var err, compare, value;
	var $ = cheerio.load(context.body);
	var key = action.key;
	var matches = $(action.jquery);
	if(action.count) {
		if(_.isNumber(action.count)) {
			compare = action.count;
		}
		else { // Assume _.isString for now. TODO - Error otherwise
			compare = parseInt(action.count);
		}
		if(matches.length!==compare) {
			return callback("Expected count of matches did not match", compare, matches.length);
		}
	}
	if(action.capture) {
		for(var key in action.capture) {
			var expression = action.capture[key];
			var asArray = false;
			if(_.isArray(expression)) {
				asArray = true;
				if(expression.length==0) {
					throw new Error("Capture value array must not be empty - key: " + key)
				}
				if(expression.length>1) {
					throw new Error("Capture value array must not have multiple elements - key: " + key)
				}
				expression = expression[0];
			}
			if(asArray) {
				context.session[key] = _.map(matches, function(match) { return getNodeValue($(match), expression); })
			}
			else {
				context.session[key] = getNodeValue($(matches[0]), expression);
			}
		}
	}
	callback(err, compare, value);
}

function getNodeValue(node, expression) {
	if(!expression || expression==="html" || expression==="outerHTML") return node.toString();
	else if(expression==="innerHTML") return node.html();
	else if(expression==="text") return node.text();
	else if(expression[0]==="@") return node.attr(expression.substring(1));
	else if(expression==="val") return node.val();
}
