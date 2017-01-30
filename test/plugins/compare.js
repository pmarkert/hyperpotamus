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

	describe("process", function () {
		function test(array, operator) {
			var context = mock_context.instance();
			var to_process = { compare: { array, operator } };
			var result = _compare.process.call(to_process, context);
			assert.equal(null, result, "Should have succeeded");
		}

		it("should process equals", () => {
			test(["a", "a"], "=");
		});
		it("should process double equals", () => {
			test(["a", "a"], "==");
		});
		it("should process triple equals", () => {
			test(["a", "a"], "===");
		});

		it("should process not_equals", () => {
			test(["a", "b"], "!=");
		});

		it("should process equals with more than 2 elements", function () {
			test(["a", "a", "a"], "=");
		});

		it("should process not_equals with more than 2 elements", function () {
			test(["a", "b", "a"], "!=");
		});

		it("should process equals with no elements", function () {
			test([], "=");
		});

		it("should process equals with one element", function () {
			test(["a"], "==");
		});

		it("should fail not_equals", function () {
			assert.throws(() => test(["a", "a"], "!="), validateVError("ComparisonFailedError"));
		});

		it("should fail equals", function () {
			assert.throws(() => test(["a", "b"], "=="), validateVError("ComparisonFailedError"));
		});
	});
});

