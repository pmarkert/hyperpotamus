var _ = require("lodash");
var interpolate;
var xmldom = require("xmldom");
var xpath = require("xpath");

module.exports.handles = function(action) {
	return _.isObject(action.xpath);
}

module.exports.process = function(context) {
	var doc = new xmldom.DOMParser().parseFromString(context.body);
	for(var key in this.xpath.capture) {
		var expression = this.xpath.capture[key];
		var asArray = false;
		if(_.isArray(expression)) {
			asArray = true;
			if(expression.length==0) {
				throw { message : "Capture value array must not be empty - key: " + key };
			}
			if(expression.length>1) {
				throw { message : "Capture value array must not have multiple elements - key: " + key };
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
}

function getNodeValue(node) {
	if(node.nodeType === node.ATTRIBUTE_NODE)
		return node.nodeValue;
	else
		return node.toString();
}
