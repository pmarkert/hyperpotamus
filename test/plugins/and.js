var _ = require("lodash");
var _and = require("../../lib/plugins/and");
var assert = require("assert");
var mock_context = require("../mock_context");
var normalizer = require("../mock_normalizer");
var validateVError = require("../lib/validate_verror");

describe("and plugin", function () {
	describe("normalization", function () {
		function test(to_normalize, length) {
			var result = _and.normalize(to_normalize, normalizer);
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isArray(result.and), "Should have had a .and property that is an array");
			assert(result.and.length == length, `Should have had ${length} nested actions`);
			assert(_.every(result.and, (action) => action.normalized === true));
		}

		it("should normalize an array", function () {
			test([{ name: "first", normalized: false }, { name: "second", normalized: false }], 2);
		});

		it("should normalize an array of 1 element", function () {
			test([{ name: "first", normalized: false }], 1);
		});

		it("should normalize an array of 0 elements", function () {
			test([], 0);
		});

		it("should normalize an 'and' action", function () {
			test({ and: [{ name: "first", normalized: false }, { name: "second", normalized: false }] }, 2);
		});

		it("should not normalize unexpected types", function () {
			assert(_and.normalize(null, normalizer) == null);
		});

		it("should not normalize null", function () {
			assert(_and.normalize(3, normalizer) == null);
		});

		it("should not normalize a string", function () {
			assert(_and.normalize("String", normalizer) == null);
		});

		it("should not normalize true", function () {
			assert(_and.normalize(true, normalizer) == null);
		});

		it("should not normalize false", function () {
			assert(_and.normalize(false, normalizer) == null);
		});

		it("should not normalize a Date", function () {
			assert(_and.normalize(new Date(), normalizer) == null);
		});

		it("should not normalize an object without .and", function () {
			assert(_and.normalize({ object: true }, normalizer) == null);
		});

		it("should throw an error if .and is not an array", function () {
			assert.throws(() => _and.normalize({ and: true }, normalizer), validateVError("ActionStructureError.and"));
		});
	});

	describe("process", function () {
		function test(to_process) {
			var context = mock_context.instance();
			return _and.process.call(to_process, context).then(() => {
				assert.deepEqual(to_process.and, context.processed_actions, "Processed actions should have matched");
			});
		}

		it("should succeed with empty array", function () {
			return test({ and: [] });
		});

		it("should succeed with an array of 1", function () {
			return test({ and: [true] });
		});

		it("should process nested actions", function () {
			return test({ and: [ true, true ]});
		});

		it("should fail with nested failing actions", function () {
			var context = mock_context.instance();
			var to_process = { and: [true, false] };
			return _and.process.call(to_process, context).then(() => {
				assert.fail("Should not have succeeded");
			}).catch(() => {
				assert.deepEqual(to_process.and, context.processed_actions, "Processed actions should have matched");
			});
		});

		// TODO - this test does not really test the AND short-circuit, because it is the processor class that evaluates
		// arrays of objects for processing. Right now, we are essentially testing that our mock context short-circuits.
		it("should short-circuit processing of nested actions on failure", function () {
			var context = mock_context.instance();
			var to_process = { and: [true, false, true] };
			return _and.process.call(to_process, context).then(() => {
				assert.fail("Should not have succeeded");
			}).catch(() => {
				assert.deepEqual([true, false], context.processed_actions, "Processed actions should have matched");
			});
		});
	});
});
