var _ = require("underscore");
var interpolate;
var xmldom = require("xmldom");
var xpath = require("xpath");

module.exports.name = "xpath";

module.exports.handles = function(action) {
	return _.isObject(action.xpath);
}

module.exports.process = function(action, context, callback) {
	var doc = new xmldom.DOMParser().parseFromString(context.body);
	for(var key in action.xpath.capture) {
		var expression = action.xpath.capture[key];
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
			context.session[key] = _.map(xpath.select(expression, doc), getNodeValue);
		}
		else {
			context.session[key] = getNodeValue(xpath.select1(expression, doc));
		}
	}
	callback();
}

function getNodeValue(node) {
	if(node.nodeType === node.ATTRIBUTE_NODE)
		return node.nodeValue;
	else
		return node.toString();
}
