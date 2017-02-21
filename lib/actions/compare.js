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
var moment = require("moment-timezone");
var assert = require("assert");

function rewrite(action, property, operator) {
	if (_.has(action, property)) {
		module.exports.logger.trace("Rewriting '" + property + "' action to 'compare'");
		action.compare = { operator: operator, array: action[property] };
		delete(action[property]);
		return action;
	}
}

module.exports.normalize = function (action, normalize_action, path) {
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
				throw new verror.VError({
					name: "InvalidComparisonOperator",
					info: {
						path: path + ".compare.operator"
					}
				}, "Operator not supported for comparison: %s", action.compare.operator);
			}
			return action;
		}
	}
};

function compare_values(previous, current, operator, comparisonType) {
	module.exports.logger.debug(`About to evaluate: ${previous} ${operator} ${current}`);
	if (comparisonType == "moment") {
		switch (operator) {
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

function getComparisonType(value, path) {
	if (_.isNaN(value)) {
		throw new verror.VError({
			name: "InvalidComparisonType",
			info: {
				path
			}
		}, "Comparison value is not a supported type to compare. Value: NaN");
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
	else if (_.isObject(value) && value._isAMomentObject) {
		return "moment";
	}
	else if (_.isBoolean(value)) {
		return "boolean";
	}
	throw new verror.VError({
		name: "InvalidComparisonType",
		info: {
			path
		}
	}, "Comparison value is not a supported type to compare. Value: %s, Type: %s", JSON.stringify(value), typeof(value));
}

function validateOperatorForComparisonType(comparisonType, operator, path) {
	if (_.includes(["boolean", "null"], comparisonType)) {
		if (!_.includes(["=", "!="], operator)) {
			throw new verror.VError({ 
				name: "InvalidComparisonOperatorForType",
				info: {
					path,
					comparisonType,
					operator 
				}
			}, "Comparison values of type %s can only be compared for = or !=, not for %s", comparisonType, operator);
		}
	}
}

module.exports.process = function () {
	// Array of items to be compare
	if (!_.isArray(this.compare.array)) {
		throw new verror.VError({ 
			name: "InvalidComparisonType", 
			info: { 
				comparisonTarget: this.compare.array,
				path: this.path + ".compare.array"
			} 
		}, "Comparison target must be an array");
	}
	if (this.compare.array.length < 2) {
		throw new verror.VError({ 
			name: "InvalidComparisonArray", 
			info: { 
				comparisonTarget: this.compare.array,
				path: this.path + "compare.array"
			} 
		}, "Comparison array must have at least 2 objects.");
	}
	var previous = undefined;
	var comparisonType = undefined;
	var current;
	for (var i = 0; i < this.compare.array.length; i++) {
		current = this.compare.array[i];
		if (previous === undefined) {
			comparisonType = getComparisonType(current, this.path + ".compare.array." + i);
			validateOperatorForComparisonType(comparisonType, this.compare.operator, this.path + ".compare");
			previous = current;
		}
		else {
			if (comparisonType != getComparisonType(current, this.path + ".compare.array." + i)) {
				throw new verror.VError({ 
					name: "ComparisonTypeMismatch", 
					info: { 
						previous, 
						current, 
						comparisonIndex: i, 
						operator: this.compare.operator, 
						establishedComparisonType: comparisonType, 
						currentElementComparisonType: getComparisonType(current) 
					} 
				}, "Comparison type mis-match at position %s while comparing: %s %s %s", i, previous, this.compare.operator, current);
			}
			if (!compare_values(previous, current, this.compare.operator, comparisonType)) {
				throw new verror.VError({ 
					name: "ComparisonValueMismatch", 
					info: { 
						previous, 
						current, 
						comparisonIndex: i, 
						path: this.path + ".compare.array." + i,
						operator: this.compare.operator 
					} 
				}, "Comparison value mis-match at position %s while comparing: %s %s %s", i, previous, this.compare.operator, current);
			}
			previous = current;
		}
	}
};
