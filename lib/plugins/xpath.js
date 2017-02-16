var _ = require("lodash");
var xmldom = require("xmldom");
var xpath = require("xpath");
var verror = require("verror");

module.exports.process = function (context) {
	var doc = new xmldom.DOMParser().parseFromString(context.body);
	for (var key in this.xpath.capture) {
		var expression = this.xpath.capture[key];
		if (_.isArray(expression)) {
			if (expression.length != 1) {
				throw new verror.VError({
					name: "InvalidActionValue.xpath",
					info: {
						path: this.path + ".xpath.capture." + key
					}
				}, "If xpath.capture value is an array it must have a single element");
			}
			_.set(context.session, key, _.map(xpath.select(expression[0], doc), getNodeValue));
		}
		else {
			_.set(context.session, key, getNodeValue(xpath.select1(expression, doc)));
		}
	}
};

function getNodeValue(node) {
	if (node.nodeType === node.ATTRIBUTE_NODE) {
		return node.nodeValue;
	} else {
		return node.toString();
	}
}
