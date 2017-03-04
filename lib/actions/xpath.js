var _ = require("lodash");
var xmldom = require("xmldom");
var xpath = require("xpath");
var verror = require("verror");

module.exports.process = function (context) {
	var target = this.target;
	if(_.isNil(target)) {
		var response = context.getSessionValue("hyperpotamus.response", null, undefined);
		if (_.isNil(response)) {
			throw new verror.VError({
				name: "InvalidActionPlacement.jquery",
				info: {
					path: this.path + ".jquery"
				}
			}, "If the jquery action is not used within the .response of a request action, then an explicit .target must be specified.");
		}
		target = response.body.toString();
	}
	var doc = new xmldom.DOMParser().parseFromString(target);
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
