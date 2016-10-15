module.exports.name = "compare";
module.exports.safe = true;

var logger = require("../logging").logger("hyperpotamus.plugins." + module.exports.name);

/*
Purpose:
  Compares elements in an array based upon the specified operator.
  Each element in the array is compared to the previous element, if any comparison fails, then the action fails.
  Alias is equals (which sets operator to "=")

  .compare is an array of elements to be compared
  .operator is the operator to apply to the elements.

  Valid operators are
    = (also == ===)
    <
    >
    <=
    >=
    <> (also !=, !==)

Examples:
  compare: [ item1, ... itemn ]
  operator: "<>"
========
  equals: [ item1, item2 ]
*/

var _ = require("underscore");

module.exports = {
	normalize: normalize,
	handles: handles,
	process: process
}

function normalize(action) {
	if(_.isObject(action)) {
		if(!_.isUndefined(action.equals)) {
			logger.trace("Normalizing 'equals' action to 'compare' action");
			action.operator = "=";
			action.compare = action.equals;
			delete(action.equals);
			if(!_.isArray(action.compare)) {
				throw new Error("Comparison target must be an array");
			}
			return action;
		}
		if(!_.isUndefined(action.compare)) {
			action.operator = action.operator || "=";
			if(!_.isArray(action.compare)) {
				throw new Error("Comparison target must be an array");
			}
			return action;
		}
	}
}

function handles(action) {
	return _.isObject(action) && _.isArray(action.compare);
}

function compare_values(compare, value, operator) {
	logger.debug("About to compare values - " + JSON.stringify(compare) + operator + JSON.stringify(value));
	if(!isNaN(compare)) {
		logger.debug("Coercing comparison value to numeric.");
		compare = +compare;
	}
	switch(operator) {
		case "=":
		case "==":
		case "===":
			return compare == value;
		case "<":
			return compare < value;
		case "<=":
			return compare <= value;
		case ">":
			return compare > value;
		case ">=":
			return compare >= value;
		case "!=":
		case "!==":
		case "<>":
			return compare != value;
		default:
			throw { message : "Unknown comparison operator", operator : operator };
	}
}

function process(context) {
        var err, expected, actual;
        // Array of items that should all be equal
	for(var i=0; i<this.compare.length; i++) {
		actual = this.compare[i];
		if(!expected) {
			expected = actual;
		}
		else {
			if(!compare_values(expected,actual,this.operator)) {
				return { message : "Element at position " + i + " did not match comparison value", actual: actual, expected: expected };
			}
			expected = actual;
		}
	}
}
