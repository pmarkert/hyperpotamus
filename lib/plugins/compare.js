module.exports.safe = true;

/*
Purpose:
  Compares the elements in an array based upon the specified operator.
  Each element in the array is compared to the previous element, if any comparison fails, then the action fails.

  .array is an array of elements to be compared
  .operator is the operator to apply to the elements.

 Valid operators are
 = (also == ===)
 <
 >
 <=
 >=
 <> (also !=, !==)

Normalization Shortcuts:
  - equal: [array] // or "equals" for backwards compatibility
  - greater_than: [array]
  - greater_than_or_equal: [array]
  - less_than: [array]
  - less_than_or_equal: [array]
  - not_equal: [array]

Examples:
  compare:
   array: [ item1, ... itemn ]
   operator: "<>"
 ========
  equals: [ item1, item2 ]
 ========
  greater_than: [ 3, 2, 1 ]
 ========
  less_than_or_equal: [ 1, 2, 3 ]
 ========
  not_equals: [ 1, 2, 3 ]
*/

var _ = require("lodash");

function rewrite(action, property, operator) {
	if (_.has(action, property)) {
		module.exports.logger.trace("Rewriting '" + property + "' action to 'compare'");
		action.compare = { operator: operator, array: action[property] };
		delete(action[property]);
		return action;
	}
}

module.exports.normalize = function (action) {
	if (_.isArray(action.compare)) {
		action.compare = { array: action.compare, operator: action.operator || "=" };
		delete(action.operator);
	}
	if (_.isObject(action)) {
		var result =
			rewrite(action, "equals", "=") |
			rewrite(action, "equal", "=") |
			rewrite(action, "equal_to", "=") |
			rewrite(action, "greater_than", ">") |
			rewrite(action, "greater_than_or_equal_to", ">=") |
			rewrite(action, "less_than", "<") |
			rewrite(action, "less_than_or_equal_to", "<=") |
			rewrite(action, "not_equals", "!=") |
			rewrite(action, "not_equal_to", "!=") |
			rewrite(action, "not_equal", "!=");
		if (result) {
			return result;
		}

		if (_.has(action, "compare")) {
			if (!_.has(action.compare, "operator")) {
				action.compare.operator = "=";
			}
			return action;
		}
	}
};

function compare_values(compare, value, operator) {
	module.exports.logger.debug("About to compare values - " + JSON.stringify(compare.array) + operator + JSON.stringify(value));
	if (!isNaN(compare)) {
		module.exports.logger.debug("Coercing comparison value to numeric.");
		compare = +compare;
	}
	switch (operator) {
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
			throw new Error("Unknown comparison operator - " + operator);
	}
}

module.exports.process = function (context) {
	var err, expected, actual;
	// Array of items that should all be equal

	if (!_.isArray(this.compare.array)) {
		throw new Error("Comparison target must be an array");
	}
	for (var i = 0; i < this.compare.array.length; i++) {
		actual = this.compare.array[i];
		if (!expected) {
			expected = actual;
		}
		else {
			if (!compare_values(expected, actual, this.compare.operator)) {
				throw { message: `Comparison mis-match at position ${i} Expected: ${expected} ${this.compare.operator} ${actual}` };
			}
			expected = actual;
		}
	}
};
