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
var verror = require("verror");
var moment = require("moment");
var assert = require("assert");

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
			rewrite(action, "greater_than_or_equal", ">=") |
			rewrite(action, "greater_than_or_equals", ">=") |
			rewrite(action, "less_than", "<") |
			rewrite(action, "less_than_or_equal_to", "<=") |
			rewrite(action, "less_than_or_equal", "<=") |
			rewrite(action, "less_than_or_equals", "<=") |
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
			if (action.compare.operator == "==") {
				action.compare.operator = "=";
			}
			if (action.compare.operator == "<>") {
				action.compare.operator = "!=";
			}
			if (!_.includes(["=", "!=", "<", "<=", ">", ">="], action.compare.operator)) {
				throw new verror.VError({ name: "InvalidComparisonOperator" }, "Operator not supported for comparison: %s", action.compare.operator);
			}
			return action;
		}
	}
};

function compare_values(previous, current, operator, comparisonType) {
	module.exports.logger.debug(`About to evaluate: ${previous} ${operator} ${current}`);
	if (comparisonType == "moment") {
		switch(operator) {
			case "=":
				return previous.isSame(current);
			case "!=":
				return !previous.isSame(current);
			case "<":
				return previous.isBefore(current);
			case "<=":
				return previous.isSameOrBefore(current);
			case ">":
				return previous.isAfter(current);
			case ">=":
				return previous.isSameOrAfter(current);
			default:
				assert.fail("Operator should have already been validated during normalize(). Unexpected comparison operator: " + operator);
		}
	}
	else {
		switch (operator) {
			case "=":
				return previous == current;
			case "!=":
				return previous != current;
			case "<":
				return previous < current;
			case "<=":
				return previous <= current;
			case ">":
				return previous > current;
			case ">=":
				return previous >= current;
			default:
				assert.fail("Operator should have already been validated during normalize(). Unexpected comparison operator: " + operator);
		}
	}
}

function getComparisonType(value) {
	if(_.isNaN(value)) {
		throw new verror.VError({ name: "InvalidComparisonType" }, "Comparison value is not a supported type to compare. Value: NaN", JSON.stringify(value), typeof(value));
	}
	else if (_.isNil(value)) {
		return "null";
	}
	else if (_.isString(value)) {
		return "string";
	}
	else if (_.isNumber(value)) {
		return "number";
	}
	else if (_.isDate(value)) {
		return "date";
	}
	else if (value instanceof moment) {
		return "moment";
	}
	else if (_.isBoolean(value)) {
		return "boolean";
	}
	throw new verror.VError({ name: "InvalidComparisonType" }, "Comparison value is not a supported type to compare. Value: %s, Type: %s", JSON.stringify(value), typeof(value));
}

function validateOperatorForComparisonType(comparisonType, operator) {
	if(_.includes(["boolean", "null"], comparisonType)) {
		if(!_.includes(["=", "!="], operator)) {
			throw new verror.VError({ name: "InvalidComparisonOperatorForType" }, "Comparison values of type %s can only be compared for = or !=, not for %s", comparisonType, operator);
		}
	}
}

// We need to keep the context parameter because the Arity of the function determines
// whether it is sync or async
// eslint-disable-next-line no-unused-vars
module.exports.process = function (context) {
	// Array of items to be compare
	if (!_.isArray(this.compare.array)) {
		throw new verror.VError({ name: "InvalidComparisonType", info: { comparison_target: this.compare.array }}, "Comparison target must be an array");
	}
	if (this.compare.array.length < 2) {
		throw new verror.VError({ name: "InvalidComparisonArray", info: { comparison_target: this.compare.array } }, "Comparison array must have at least 2 objects. Comparison array: %s", JSON.stringify(this.compare.array));
	}
	var previous = undefined;
	var comparisonType = undefined;
	var current;
	for (var i = 0; i < this.compare.array.length; i++) {
		current = this.compare.array[i];
		if (previous === undefined) {
			comparisonType = getComparisonType(current);
			validateOperatorForComparisonType(comparisonType, this.compare.operator);
			previous = current;
		}
		else {
			if (comparisonType != getComparisonType(current)) {
				throw new verror.VError({ name: "ComparisonTypeMismatch", info: { previous, current, comparison_index: i, operator: this.compare.operator, established_comparison_type: comparisonType, current_element_comparison_type: getComparisonType(current) } }, "Comparison type mis-match at position %s while comparing: %s %s %s", i, previous, this.compare.operator, current);
			}
			if (!compare_values(previous, current, this.compare.operator, comparisonType)) {
				throw new verror.VError({ name: "ComparisonValueMismatch", info: { previous, current, comparison_index: i, operator: this.compare.operator } }, "Comparison value mis-match at position %s while comparing: %s %s %s", i, previous, this.compare.operator, current);
			}
			previous = current;
		}
	}
};
