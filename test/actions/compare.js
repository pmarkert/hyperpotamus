var _ = require("lodash");
var _compare = require("../../lib/actions/compare");
var assert = require("assert");
var mock_context = require("../mock_context");
var normalizer = require("../mock_normalizer");
var validateVError = require("../test_utils/validate_verror");
var moment = require("moment");
_compare.logger = require("../mock_logger");

describe("compare.js", () => {
	describe("normalize()", () => {
		describe("should rewrite", () => {
			function test(operator_field, operator_symbol) {
				var to_normalize = {};
				to_normalize[operator_field] = [{ name: "first", normalized: false }, { name: "second", normalized: false }];
				var result = _compare.normalize(to_normalize, normalizer);
				assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
				assert(_.isObject(result.compare), "Should have had a .compare property");
				assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
				assert.equal(result.compare.operator, operator_symbol, "Should have had an .operator property of " + operator_symbol);
			}

			it("equals", () => test("equals", "="));
			it("equal", () => test("equal", "="));
			it("equal_to", () => test("equal_to", "="));
			it("less_than", () => test("less_than", "<"));
			it("less_than_or_equal_to", () => test("less_than_or_equal_to", "<="));
			it("less_than_or_equal", () => test("less_than_or_equal", "<="));
			it("less_than_or_equals", () => test("less_than_or_equals", "<="));
			it("greater_than", () => test("greater_than", ">"));
			it("greater_than_or_equal_to", () => test("greater_than_or_equal_to", ">="));
			it("greater_than_or_equal", () => test("greater_than_or_equal", ">="));
			it("greater_than_or_equals", () => test("greater_than_or_equals", ">="));
			it("not_equal", () => test("not_equal", "!="));
			it("not_equals", () => test("not_equals", "!="));
			it("not_equal_to", () => test("not_equal_to", "!="));
		});

		describe("should normalize", () => {
			function test(operator_symbol, normalized_operator_symbol) {
				normalized_operator_symbol = normalized_operator_symbol || operator_symbol;
				var to_normalize = { compare: { operator: operator_symbol, array: [1, 2] } };
				var result = _compare.normalize(to_normalize);
				assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
				assert(_.isObject(result.compare), "Should have had a .compare property that is an object");
				assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
				assert.strictEqual(result.compare.array, to_normalize.compare.array, "Should not have modified comparison array");
				assert.equal(result.compare.operator, normalized_operator_symbol, "Should have had an .operator property of " + normalized_operator_symbol);
			}

			it("=", () => test("="));
			it("==", () => test("==", "="));
			it("<", () => test("<"));
			it("<=", () => test("<="));
			it(">", () => test(">"));
			it(">=", () => test(">="));
			it("!=", () => test("!="));
			it("<>", () => test("<>", "!="));

		});
	});

	describe("process", () => {
		function test(array, operator) {
			var context = mock_context.instance();
			var to_process = { compare: { array, operator } };
			var result = _compare.process.call(to_process, context);
			assert.equal(null, result, "Should have succeeded");
		}

		function testFailure(array, operator, error) {
			assert.throws(() => test(array, operator), validateVError(error));
		}

		var date = new Date();
		var later_date = new Date(date.getTime()+3);

		describe("operator: =", () => {
			describe("should succeed with", () => {
				it("empty strings", () => test(["", ""], "="));
				it("strings", () => test(["a", "a"], "="));
				it("numbers (0)", () => test([0, 0], "="));
				it("numbers (1)", () => test([1, 1], "="));
				it("numbers (-1)", () => test([-1, -1], "="));
				it("dates", () => test([date, date], "="));
				it("true", () => test([true, true], "="));
				it("false", () => test([false, false], "="));
				it("null", () => test([null, null], "="));
				it("moment dates", () => test([moment(date), moment(date)], "="));
			});

			describe("should fail with", () => {
				it("unequal strings", () => testFailure(["a", "b"], "=", "ComparisonValueMismatch"));
				it("unequal numbers", () => testFailure([1, 2], "=", "ComparisonValueMismatch"));
				it("unequal dates", () => testFailure([date, later_date], "=", "ComparisonValueMismatch"));
				it("unequal moments", () => testFailure([moment(date), moment(later_date)], "=", "ComparisonValueMismatch"));
				it("unequal booleans", () => testFailure([true, false], "=", "ComparisonValueMismatch"));
				it("unequal after 2nd element", () => testFailure(["a", "a", "b"], "=", "ComparisonValueMismatch"));
			});
		});

		describe("operator: !=", () => {
			describe("should succeed with", () => {
				it("unequal strings", () => test(["a", "b"], "!="));
				it("unequal numbers", () => test([1, 2], "!="));
				it("unequal dates", () => test([date, later_date], "!="));
				it("unequal moments", () => test([moment(date), moment(later_date)], "!="));
				it("unequal booleans", () => test([true, false], "!="));
			});

			describe("should fail with", () => {
				it("empty strings", () => testFailure(["", ""], "!=", "ComparisonValueMismatch"));
				it("strings", () => testFailure(["a", "a"], "!=", "ComparisonValueMismatch"));
				it("numbers (0)", () => testFailure([0, 0], "!=", "ComparisonValueMismatch"));
				it("numbers (1)", () => testFailure([1, 1], "!=", "ComparisonValueMismatch"));
				it("numbers (-1)", () => testFailure([-1, -1], "!=", "ComparisonValueMismatch"));
				it("dates", () => testFailure([date, date], "!=", "ComparisonValueMismatch"));
				it("true", () => testFailure([true, true], "!=", "ComparisonValueMismatch"));
				it("false", () => testFailure([false, false], "!=", "ComparisonValueMismatch"));
				it("null", () => testFailure([null, null], "!=", "ComparisonValueMismatch"));
				it("moment dates", () => testFailure([moment(date), moment(date)], "!=", "ComparisonValueMismatch"));
				it("unequal after 2nd element", () => testFailure(["a", "b", "b"], "!=", "ComparisonValueMismatch"));
			});
		});

		describe("operator: <", () => {
			describe("should succeed with", () => {
				it("strings", () => test(["a", "b"], "<"));
				it("numbers", () => test([1, 2], "<"));
				it("dates", () => test([date, later_date], "<"));
				it("moments", () => test([moment(date), moment(later_date)], "<"));
			});

			describe("should fail with", () => {
				it("booleans", () => testFailure([true, false], "<", "InvalidComparisonOperatorForType"));
				it("true", () => testFailure([true, true], "<", "InvalidComparisonOperatorForType"));
				it("false", () => testFailure([false, false], "<", "InvalidComparisonOperatorForType"));
				it("null", () => testFailure([null, null], "<", "InvalidComparisonOperatorForType"));
				it("empty strings", () => testFailure(["", ""], "<", "ComparisonValueMismatch"));
				it("equal strings", () => testFailure(["a", "a"], "<", "ComparisonValueMismatch"));
				it("greater_than strings", () => testFailure(["b", "a"], "<", "ComparisonValueMismatch"));
				it("equal numbers (0)", () => testFailure([0, 0], "<", "ComparisonValueMismatch"));
				it("equal numbers (1)", () => testFailure([1, 1], "<", "ComparisonValueMismatch"));
				it("greater_than numbers (-1)", () => testFailure([2, 1], "<", "ComparisonValueMismatch"));
				it("equal dates", () => testFailure([date, date], "<", "ComparisonValueMismatch"));
				it("greater_than dates", () => testFailure([later_date, date], "<", "ComparisonValueMismatch"));
				it("equal moment dates", () => testFailure([moment(date), moment(date)], "<", "ComparisonValueMismatch"));
				it("greater_than moment dates", () => testFailure([moment(later_date), moment(date)], "<", "ComparisonValueMismatch"));
				it("after 2nd element", () => testFailure(["a", "b", "b"], "<", "ComparisonValueMismatch"));
			});
		});

		describe("operator: <=", () => {
			describe("should succeed with", () => {
				it("strings", () => test(["a", "b"], "<="));
				it("numbers", () => test([1, 2], "<="));
				it("dates", () => test([date, later_date], "<="));
				it("moments", () => test([moment(date), moment(later_date)], "<="));
				it("empty strings", () => test(["", ""], "<="));
				it("equal strings", () => test(["a", "a"], "<="));
				it("equal numbers (0)", () => test([0, 0], "<="));
				it("equal numbers (1)", () => test([1, 1], "<="));
				it("equal dates", () => test([date, date], "<="));
				it("equal moment dates", () => test([moment(date), moment(date)], "<="));
			});

			describe("should fail with", () => {
				it("booleans", () => testFailure([true, false], "<=", "InvalidComparisonOperatorForType"));
				it("true", () => testFailure([true, true], "<=", "InvalidComparisonOperatorForType"));
				it("false", () => testFailure([false, false], "<=", "InvalidComparisonOperatorForType"));
				it("null", () => testFailure([null, null], "<=", "InvalidComparisonOperatorForType"));
				it("greater_than strings", () => testFailure(["b", "a"], "<=", "ComparisonValueMismatch"));
				it("greater_than numbers (-1)", () => testFailure([2, 1], "<=", "ComparisonValueMismatch"));
				it("greater_than dates", () => testFailure([later_date, date], "<=", "ComparisonValueMismatch"));
				it("greater_than moment dates", () => testFailure([moment(later_date), moment(date)], "<=", "ComparisonValueMismatch"));
				it("after 2nd element", () => testFailure(["a", "b", "a"], "<=", "ComparisonValueMismatch"));
			});
		});

		describe("operator: >", () => {
			describe("should succeed with", () => {
				it("strings", () => test(["c", "b"], ">"));
				it("numbers", () => test([3, 2], ">"));
				it("dates", () => test([later_date, date], ">"));
				it("moments", () => test([moment(later_date), moment(date)], ">"));
			});

			describe("should fail with", () => {
				it("booleans", () => testFailure([true, false], ">", "InvalidComparisonOperatorForType"));
				it("true", () => testFailure([true, true], ">", "InvalidComparisonOperatorForType"));
				it("false", () => testFailure([false, false], ">", "InvalidComparisonOperatorForType"));
				it("null", () => testFailure([null, null], ">", "InvalidComparisonOperatorForType"));
				it("empty strings", () => testFailure(["", ""], ">", "ComparisonValueMismatch"));
				it("equal strings", () => testFailure(["c", "c"], ">", "ComparisonValueMismatch"));
				it("greater_than strings", () => testFailure(["b", "c"], ">", "ComparisonValueMismatch"));
				it("equal numbers (0)", () => testFailure([0, 0], ">", "ComparisonValueMismatch"));
				it("equal numbers (3)", () => testFailure([1, 1], ">", "ComparisonValueMismatch"));
				it("less_than numbers (-1)", () => testFailure([1, 2], ">", "ComparisonValueMismatch"));
				it("equal dates", () => testFailure([date, date], ">", "ComparisonValueMismatch"));
				it("less_than dates", () => testFailure([date, later_date], ">", "ComparisonValueMismatch"));
				it("equal moment dates", () => testFailure([moment(date), moment(date)], ">", "ComparisonValueMismatch"));
				it("less_than moment dates", () => testFailure([moment(date), moment(later_date)], ">", "ComparisonValueMismatch"));
				it("after 2nd element", () => testFailure(["c", "b", "b"], ">", "ComparisonValueMismatch"));
			});
		});

		describe("operator: >=", () => {
			describe("should succeed with", () => {
				it("strings", () => test(["c", "b"], ">="));
				it("numbers", () => test([3, 2], ">="));
				it("dates", () => test([later_date, date], ">="));
				it("moments", () => test([moment(later_date), moment(date)], ">="));
				it("empty strings", () => test(["", ""], ">="));
				it("equal strings", () => test(["c", "c"], ">="));
				it("equal numbers (0)", () => test([0, 0], ">="));
				it("equal numbers (1)", () => test([1, 1], ">="));
				it("equal dates", () => test([date, date], ">="));
				it("equal moment dates", () => test([moment(date), moment(date)], ">="));
			});

			describe("should fail with", () => {
				it("booleans", () => testFailure([true, false], ">=", "InvalidComparisonOperatorForType"));
				it("true", () => testFailure([true, true], ">=", "InvalidComparisonOperatorForType"));
				it("false", () => testFailure([false, false], ">=", "InvalidComparisonOperatorForType"));
				it("null", () => testFailure([null, null], ">=", "InvalidComparisonOperatorForType"));
				it("less_than strings", () => testFailure(["b", "c"], ">=", "ComparisonValueMismatch"));
				it("less_than numbers (-1)", () => testFailure([1, 2], ">=", "ComparisonValueMismatch"));
				it("less_than dates", () => testFailure([date, later_date], ">=", "ComparisonValueMismatch"));
				it("less_than moment dates", () => testFailure([moment(date), moment(later_date)], ">=", "ComparisonValueMismatch"));
				it("after 2nd element", () => testFailure(["c", "b", "c"], ">=", "ComparisonValueMismatch"));
			});
		});

		describe("should fail with mis-matched types", () => {
			it("string, number", () => testFailure(["1", 1], "=", "ComparisonTypeMismatch"));
			it("string, true", () => testFailure(["1", true], "=", "ComparisonTypeMismatch"));
			it("string, false", () => testFailure(["1", false], "=", "ComparisonTypeMismatch"));
			it("string, date", () => testFailure(["1", date], "=", "ComparisonTypeMismatch"));
			it("string, moment", () => testFailure(["1", moment(date)], "=", "ComparisonTypeMismatch"));
			it("string, null", () => testFailure(["1", null], "=", "ComparisonTypeMismatch"));

			it("number, string", () => testFailure([1, "1"], "=", "ComparisonTypeMismatch"));
			it("number, true", () => testFailure([1, true], "=", "ComparisonTypeMismatch"));
			it("number, false", () => testFailure([0, false], "=", "ComparisonTypeMismatch"));
			it("number, date", () => testFailure([1, date], "=", "ComparisonTypeMismatch"));
			it("number, moment", () => testFailure([1, moment(date)], "=", "ComparisonTypeMismatch"));
			it("number, null", () => testFailure([0, null], "=", "ComparisonTypeMismatch"));

			it("true, string", () => testFailure([true, "true"], "=", "ComparisonTypeMismatch"));
			it("true, number", () => testFailure([false, 1], "=", "ComparisonTypeMismatch"));
			it("true, date", () => testFailure([true, date], "=", "ComparisonTypeMismatch"));
			it("true, moment", () => testFailure([true, moment(date)], "=", "ComparisonTypeMismatch"));
			it("true, null", () => testFailure([true, null], "=", "ComparisonTypeMismatch"));

			it("false, string", () => testFailure([false, "false"], "=", "ComparisonTypeMismatch"));
			it("false, number", () => testFailure([false, 0], "=", "ComparisonTypeMismatch"));
			it("false, date", () => testFailure([false, date], "=", "ComparisonTypeMismatch"));
			it("false, moment", () => testFailure([false, moment(date)], "=", "ComparisonTypeMismatch"));
			it("false, null", () => testFailure([false, null], "=", "ComparisonTypeMismatch"));

			it("date, string", () => testFailure([date, "a"], "=", "ComparisonTypeMismatch"));
			it("date, number", () => testFailure([date, 1], "=", "ComparisonTypeMismatch"));
			it("date, true", () => testFailure([date, true], "=", "ComparisonTypeMismatch"));
			it("date, false", () => testFailure([date, false], "=", "ComparisonTypeMismatch"));
			it("date, moment", () => testFailure([date, moment(date)], "=", "ComparisonTypeMismatch"));
			it("date, null", () => testFailure([date, null], "=", "ComparisonTypeMismatch"));

			it("moment, string", () => testFailure([moment(date), "a"], "=", "ComparisonTypeMismatch"));
			it("moment, number", () => testFailure([moment(date), 1], "=", "ComparisonTypeMismatch"));
			it("moment, true", () => testFailure([moment(date), true], "=", "ComparisonTypeMismatch"));
			it("moment, false", () => testFailure([moment(date), false], "=", "ComparisonTypeMismatch"));
			it("moment, date", () => testFailure([moment(date), date], "=", "ComparisonTypeMismatch"));
			it("moment, null", () => testFailure([moment(date), null], "=", "ComparisonTypeMismatch"));
		});
		
		describe("should fail with invalid types", () => {
			it("no elements", () => testFailure([], "=", "InvalidComparisonArray"));
			it("1 element", () => testFailure(["a"], "=", "InvalidComparisonArray"));
			it("NaN value", () => testFailure([NaN, NaN], "=", "InvalidComparisonType"));
			it("array values", () => testFailure([[1, 2], [1, 2]], "=", "InvalidComparisonType"));
			it("object values", () => testFailure([{ a: "a", b: "b" }, { a: "a", b: "b" }], "=", "InvalidComparisonType"));
			it("true value for compare .array property", () => testFailure(true, "=", "InvalidComparisonType"));
			it("false value for compare .array property", () => testFailure(false, "=", "InvalidComparisonType"));
			it("string value for compare .array property", () => testFailure("asdf", "=", "InvalidComparisonType"));
			it("date value for compare .array property", () => testFailure(new Date(), "=", "InvalidComparisonType"));
			it("null value for compare .array property", () => testFailure(null, "=", "InvalidComparisonType"));
			it("object value for compare .array property", () => testFailure({}, "=", "InvalidComparisonType"));
		});
	});
});
