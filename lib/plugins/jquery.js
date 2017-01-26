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

module.exports.process = function (context) {
	var compare;
	var $ = cheerio.load(context.body);
	var matches = $(this.jquery);
	if (this.count) {
		if (_.isNumber(this.count)) {
			compare = this.count;
		}
		else { // Assume _.isString for now. TODO - Error otherwise
			compare = parseInt(this.count);
		}
		if (matches.length !== compare) {
			throw { message: "Expected count of matches did not match", expected: compare, actual: matches.length };
		}
	}
	if (this.capture) {
		for (var key in this.capture) {
			var expression = this.capture[key];
			var asArray = false;
			if (_.isArray(expression)) {
				asArray = true;
				if (expression.length == 0) {
					throw { message: "Capture value array must not be empty - key: " + key };
				}
				if (expression.length > 1) {
					throw { message: "Capture value array must not have multiple elements - key: " + key };
				}
				expression = expression[0];
			}
			if (asArray) {
				context.session[key] = _.map(matches, function (match) {
					return getNodeValue($(match), expression);
				});
			}
			else {
				context.session[key] = getNodeValue($(matches[0]), expression);
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
