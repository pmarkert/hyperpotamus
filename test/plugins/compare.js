var _ = require("lodash");
var _compare = require("../../lib/plugins/compare");
var assert = require("assert");
var mock_context = require("../mock_context");
var normalizer = require("../mock_normalizer");
var validateVError = require("../lib/validate_verror");

describe("compare plugin", () => {
	describe("normalization", () => {
		function test(operator_field, operator_symbol) {
			var to_normalize = {};
			to_normalize[operator_field] = [{ name: "first", normalized: false }, { name: "second", normalized: false }];
			var result = _compare.normalize(to_normalize, normalizer);
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, operator_symbol, "Should have had an .operator property of " + operator_symbol);
		}

		it("should normalize equals", () => {
			test("equals", "=");
		});

		it("should normalize equal", () => {
			test("equal", "=");
		});

		it("should normalize equal_to", () => {
			test("equal_to", "=");
		});

		it("should normalize less_than", () => {
			test("less_than", "<");
		});

		it("should normalize less_than_or_equal_to", () => {
			test("less_than_or_equal_to", "<=");
		});

		it("should normalize less_than_or_equal", () => {
			test("less_than_or_equal", "<=");
		});

		it("should normalize less_than_or_equals", () => {
			test("less_than_or_equals", "<=");
		});

		it("should normalize greater_than", () => {
			test("greater_than", ">");
		});

		it("should normalize greater_than_or_equal_to", () => {
			test("greater_than_or_equal_to", ">=");
		});

		it("should normalize greater_than_or_equal", () => {
			test("greater_than_or_equal", ">=");
		});

		it("should normalize greater_than_or_equals", () => {
			test("greater_than_or_equals", ">=");
		});

		it("should normalize not_equal", () => {
			test("not_equal", "!=");
		});

		it("should normalize not_equals", () => {
			test("not_equals", "!=");
		});

		it("should normalize not_equal_to", () => {
			test("not_equal_to", "!=");
		});
	});

	describe("process", () => {
		function test(array, operator) {
			var context = mock_context.instance();
			var to_process = { compare: { array, operator } };
			var result = _compare.process.call(to_process, context);
			assert.equal(null, result, "Should have succeeded");
		}

		describe("operator: equals", () => {
			it("should process equals", () => {
				test(["a", "a"], "=");
			});
			it("should process double equals", () => {
				test(["a", "a"], "==");
			});

			it("should process equals with more than 2 elements", function () {
				test(["a", "a", "a"], "=");
			});

			it("should process equals with no elements", function () {
				test([], "=");
			});

			it("should process equals with one element", function () {
				test(["a"], "==");
			});

			it("should fail equals", function () {
				assert.throws(() => test(["a", "b"], "=="), validateVError("ComparisonFailedError"));
			});

			it("should fail equals more than 2 elements", function () {
				assert.throws(() => test(["a", "a", "b"], "=="), validateVError("ComparisonFailedError"));
			});
		});

		describe("operator: not_equals", () => {
			it("should process not_equals", () => {
				test(["a", "b"], "!=");
			});

			it("should process greater_than_or_less_than as not_equals", () => {
				test(["a", "b"], "<>");
			});

			it("should process not_equals with more than 2 elements", function () {
				test(["a", "b", "a"], "!=");
			});

			it("should fail not_equals", function () {
				assert.throws(() => test(["a", "a"], "!="), validateVError("ComparisonFailedError"));
			});

			it("should fail not_equals more than 2 elements", function () {
				assert.throws(() => test(["a", "b", "b"], "!="), validateVError("ComparisonFailedError"));
			});
		});

		describe("operator: less_than", () => {
			it("should process less_than with strings", () => {
				test(["a", "b"], "<");
			});

			it("should process less_than with numbers", () => {
				test([1, 2], "<");
			});

			it("should process less_than with more than 2 strings", function () {
				test(["a", "b", "c"], "<");
			});

			it("should process less_than with more than 2 numbers", function () {
				test([1, 2, 3], "<");
			});

			it("should fail less_than with equal strings", function () {
				assert.throws(() => test(["a", "a"], "<"), validateVError("ComparisonFailedError"));
			});

			it("should fail less_than with equal numbers", function () {
				assert.throws(() => test([2, 2], "<"), validateVError("ComparisonFailedError"));
			});

			it("should fail less_than with greater_than numbers", function () {
				assert.throws(() => test([2, 1], "<"), validateVError("ComparisonFailedError"));
			});

			it("should fail less_than more than 2 numbers that aren't", function () {
				assert.throws(() => test([2, 1, 1], "<"), validateVError("ComparisonFailedError"));
			});
		});

		describe("operator: less_than_or_equal", () => {
			it("should process less_than_or_equal with less_than strings", () => {
				test(["a", "b"], "<=");
			});

			it("should process less_than_or_equal with equal strings", () => {
				test(["a", "a"], "<=");
			});

			it("should process less_than_or_equal with less_than numbers", () => {
				test([1, 2], "<=");
			});

			it("should process less_than_or_equal with equal numbers", () => {
				test([2, 2], "<=");
			});

			it("should process less_than_or_equal with more than 2 strings", function () {
				test(["a", "b", "c"], "<=");
			});

			it("should process less_than_or_equal with more than 2 numbers", function () {
				test([2, 2, 3], "<=");
			});

			it("should fail less_than_or_equal with greater_than numbers", function () {
				assert.throws(() => test([2, 1], "<="), validateVError("ComparisonFailedError"));
			});

			it("should fail less_than_or_equal more than 2 numbers that aren't", function () {
				assert.throws(() => test([2, 2, 1], "<="), validateVError("ComparisonFailedError"));
			});
		});

		describe("operator: greater_than", () => {
			it("should process greater_than with strings", () => {
				test(["b", "a"], ">");
			});

			it("should process greater_than with numbers", () => {
				test([2, 1], ">");
			});

			it("should process greater_than with more than 2 strings", function () {
				test(["c", "b", "a"], ">");
			});

			it("should process greater_than with more than 2 numbers", function () {
				test([3, 2, 1], ">");
			});

			it("should fail greater_than with equal strings", function () {
				assert.throws(() => test(["a", "a"], ">"), validateVError("ComparisonFailedError"));
			});

			it("should fail greater_than with equal numbers", function () {
				assert.throws(() => test([2, 2], ">"), validateVError("ComparisonFailedError"));
			});

			it("should fail greater_than with less_than numbers", function () {
				assert.throws(() => test([1, 2], ">"), validateVError("ComparisonFailedError"));
			});

			it("should fail greater_than more than 2 numbers that aren't", function () {
				assert.throws(() => test([1, 2, 2], ">"), validateVError("ComparisonFailedError"));
			});
		});

		describe("operator: greater_than_or_equal", () => {
			it("should process greater_than_or_equal with greater_than strings", () => {
				test(["b", "a"], ">=");
			});

			it("should process greater_than_or_equal with equal strings", () => {
				test(["a", "a"], ">=");
			});

			it("should process greater_than_or_equal with greater_than numbers", () => {
				test([2, 1], ">=");
			});

			it("should process greater_than_or_equal with equal numbers", () => {
				test([2, 2], ">=");
			});

			it("should process greater_than_or_equal with more than 2 strings", function () {
				test(["c", "b", "b"], ">=");
			});

			it("should process greater_than_or_equal with more than 2 numbers", function () {
				test([3, 2, 2], ">=");
			});

			it("should fail greater_than_or_equal with less_than numbers", function () {
				assert.throws(() => test([1, 2], ">="), validateVError("ComparisonFailedError"));
			});

			it("should fail greater_than_or_equal more than 2 numbers that aren't", function () {
				assert.throws(() => test([1, 1, 2], ">="), validateVError("ComparisonFailedError"));
			});
		});

		describe("invalid types", () => {
			describe("true value for compare property", () => {
				assert.throws(() => test(true, "="), validateVError("InvalidComparisonType"));
			});

			describe("false value for compare property", () => {
				assert.throws(() => test(false, "="), validateVError("InvalidComparisonType"));
			});

			describe("string value for compare property", () => {
				assert.throws(() => test("asdf", "="), validateVError("InvalidComparisonType"));
			});

			describe("date value for compare property", () => {
				assert.throws(() => test(new Date(), "="), validateVError("InvalidComparisonType"));
			});

			describe("null value for compare property", () => {
				assert.throws(() => test(null, "="), validateVError("InvalidComparisonType"));
			});

			describe("object value for compare property", () => {
				assert.throws(() => test({ }, "="), validateVError("InvalidComparisonType"));
			});

			describe("comparison with array elements", () => {
				assert.throws(() => test([[1, 2], [1, 2]], "="), validateVError("InvalidComparisonValue"));
			});

			describe("comparison with object elements", () => {
				assert.throws(() => test([{ a: "a", b: "b" }, { a: "a", b: "b" }], "="), validateVError("InvalidComparisonValue"));
			});
		});
	});
});

