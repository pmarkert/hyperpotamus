module.exports.safe = true;

/*
Purpose:
  Executes jquery paths to extract a single value or an array of values from an HTML document.

  Each key is the location where the captures will be stored. The value of each key should be a jquery path.
  If the path/value is a single-value array, then all matches will be captured as an array.

Syntax:
  - jquery:
      key1: "jquery path to capture" # only first instance will be captured
      array1: [ "jquery path" ] # all instances will be captured
*/

var _ = require("lodash");
var cheerio = require("cheerio");
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
	var compare;
	var $ = cheerio.load(target);
	var matches = $(this.jquery);
	if (this.count) {
		if (!_.isNumber(this.count)) {
			throw new verror.VError({
				name: "InvalidCountValue",
				info: {
					path: this.path + ".jquery.count"
				}
			}, "jquery.count value must be a number");
		}
		if (_.isNumber(this.count)) {
			compare = this.count;
		}
		if (matches.length !== compare) {
			throw new verror.VError({
				name: "JQueryCountDidNotMatch",
				info: {
					path: this.path
				}
			}, "Expected count of matches did not match");
		}
	}
	if (this.capture) {
		for (var key in this.capture) {
			var expression = this.capture[key];
			var asArray = false;
			if (_.isArray(expression)) {
				asArray = true;
				if (expression.length != 1) {
					throw new verror.VError({
						name: "InvalidCaptureValue",
						info: {
							path: this.path + ".capture." + key,
							value: this.capture[key]
						}
					}, "If jquery.capture value is an array it must have a single element");
				}
				expression = expression[0];
			}
			if (asArray) {
				context.setSessionValue(key, _.map(matches, function (match) {
					return getNodeValue($(match), expression);
				}));
			}
			else {
				context.setSessionValue(key, getNodeValue($(matches[0]), expression));
			}
		}
	}
};

function getNodeValue(node, expression) {
	if (!expression || expression === "html" || expression === "outerHTML") {
		return node.toString();
	} else if (expression === "innerHTML") {
		return node.html();
	} else if (expression === "text") {
		return node.text();
	} else if (expression[0] === "@") {
		return node.attr(expression.substring(1));
	} else if (expression === "val") {
		return node.val();
	}
}
