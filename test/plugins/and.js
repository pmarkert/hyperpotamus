var _ = require("lodash");
var _and = require("../../lib/plugins/and");
var assert = require("assert");
var mock_context = require("../mock_context");
var normalizer = require("../mock_normalizer");

describe("and plugin", function () {
	describe("normalization", function () {
		it("should normalize an array", function () {
			var to_normalize = [{ name: "first", normalized: false }, { name: "second", normalized: false }];
			var result = _and.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isArray(result.and), "Should have had a .and property that is an array");
			assert(result.and.length == 2, "Should have had 2 nested actions");
			assert(_.every(result.and, function (action) {
				return action.normalized == true;
			}));
		});

		it("should normalize an array of 1 element", function () {
			var to_normalize = [{ name: "first", normalized: false }];
			var result = _and.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isArray(result.and), "Should have had a .and property that is an array");
			assert(result.and.length == 1, "Should have had 1 nested action");
			assert(_.every(result.and, function (action) {
				return action.normalized == true;
			}));
		});

		it("should normalize an array of 0 elements", function () {
			var to_normalize = [];
			var result = _and.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isArray(result.and), "Should have had a .and property that is an array");
			assert(result.and.length == 0, "Should have had 1 nested action");
			assert(_.every(result.and, function (action) {
				return action.normalized == true;
			}));
		});

		it("should normalize an and action", function () {
			var to_normalize = { and: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _and.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isArray(result.and), "Should have had a .and property that is an array");
			assert(result.and.length == 2, "Should have had 2 nested actions");
			assert(_.every(result.and, function (action) {
				return action.normalized == true;
			}));
		});
	});

	describe("process", function () {
		it("should process nested actions", function (done) {
			var context = mock_context.instance();
			var to_process = { and: [true, true] };
			_and.process.call(to_process, context, function (result) {
				try {
					assert.equal(null, result, "Should have succeeded");
					assert.deepEqual(to_process.and, context.processed_actions, "Processed actions should have matched");
					done();
				}
				catch (err) {
					done(err);
				}
			});
		});

		it("should fail with nested failing actions", function (done) {
			var context = mock_context.instance();
			var to_process = { and: [true, false] };
			_and.process.call(to_process, context, function (result) {
				try {
					assert.equal(mock_context.expected_failure, result, "Should not have succeeded");
					assert.deepEqual(to_process.and, context.processed_actions, "Processed actions should have matched");
					done();
				}
				catch (err) {
					done(err);
				}
			});
		});
	});
});
