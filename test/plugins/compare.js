var _ = require("lodash");
var _compare = require("../../lib/plugins/compare");
var assert = require("assert");
var mock_context = require("../mock_context");
var normalizer = require("../mock_normalizer");

describe("compare plugin", function () {
	describe("normalization", function () {
		it("should normalize equals", function () {
			var to_normalize = { equals: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _compare.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, "=", "Should have had an .operator property of =");
		});

		it("should normalize equal", function () {
			var to_normalize = { equal: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _compare.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, "=", "Should have had an .operator property of =");
		});

		it("should normalize equal_to", function () {
			var to_normalize = { equal_to: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _compare.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, "=", "Should have had an .operator property of =");
		});

		it("should normalize less_than", function () {
			var to_normalize = { less_than: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _compare.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, "<", "Should have had an .operator property of <");
		});

		it("should normalize less_than_or_equal_to", function () {
			var to_normalize = { less_than_or_equal_to: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _compare.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, "<=", "Should have had an .operator property of <");
		});

		it("should normalize greater_than", function () {
			var to_normalize = { greater_than: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _compare.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, ">", "Should have had an .operator property of <");
		});

		it("should normalize greater_than_or_equal_to", function () {
			var to_normalize = { greater_than_or_equal_to: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _compare.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, ">=", "Should have had an .operator property of <");
		});

		it("should normalize not_equal", function () {
			var to_normalize = { not_equal: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _compare.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, "!=", "Should have had an .operator property of <");
		});

		it("should normalize not_equals", function () {
			var to_normalize = { not_equals: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _compare.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, "!=", "Should have had an .operator property of <");
		});

		it("should normalize not_equal_to", function () {
			var to_normalize = { not_equal_to: [{ name: "first", normalized: false }, { name: "second", normalized: false }] };
			var result = _compare.normalize(to_normalize, normalizer)
			assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
			assert(_.isObject(result.compare), "Should have had a .compare property");
			assert(_.isArray(result.compare.array), "Should have had an .array property that is an array");
			assert.equal(result.compare.operator, "!=", "Should have had an .operator property of <");
		});
	});

	describe("process", function () {
		it("should process equals", function (done) {
			var context = mock_context.instance();
			var to_process = { compare: { array: ['a', 'a'], operator: "==" } };
			try {
				var result = _compare.process.call(to_process, context);
				assert.equal(null, result, "Should have succeeded");
				done();
			}
			catch (err) {
				done(err);
			}
		});

		it("should process not_equals", function (done) {
			var context = mock_context.instance();
			var to_process = { compare: { array: ['a', 'b'], operator: "!=" } };
			try {
				var result = _compare.process.call(to_process, context);
				assert.equal(null, result, "Should have succeeded");
				done();
			}
			catch (err) {
				done(err);
			}
		});

		it("should process equals with more than 2 elements", function (done) {
			var context = mock_context.instance();
			var to_process = { compare: { array: ['a', 'a', 'a'], operator: "==" } };
			try {
				var result = _compare.process.call(to_process, context);
				assert.equal(null, result, "Should have succeeded");
				done();
			}
			catch (err) {
				done(err);
			}
		});

		it("should process not_equals with more than 2 elements", function (done) {
			var context = mock_context.instance();
			var to_process = { compare: { array: ['a', 'b', 'a'], operator: "!=" } };
			try {
				var result = _compare.process.call(to_process, context);
				assert.equal(null, result, "Should have succeeded");
				done();
			}
			catch (err) {
				done(err);
			}
		});

		it("should process equals with no elements", function (done) {
			var context = mock_context.instance();
			var to_process = { compare: { array: [], operator: "=" } };
			try {
				var result = _compare.process.call(to_process, context);
				assert.equal(null, result, "Should have succeeded");
				done();
			}
			catch (err) {
				done(err);
			}
		});

		it("should process equals with one element", function (done) {
			var context = mock_context.instance();
			var to_process = { compare: { array: ['a'], operator: "==" } };
			try {
				var result = _compare.process.call(to_process, context);
				assert.equal(null, result, "Should have succeeded");
				done();
			}
			catch (err) {
				done(err);
			}
		});

		it("should fail not_equals", function (done) {
			var context = mock_context.instance();
			var to_process = { compare: { array: ['a', 'a'], operator: "!=" } };
			try {
				var result = _compare.process.call(to_process, context);
				done("Should have failed");
			}
			catch (err) {
				done();
			}
		});

		it("should fail equals", function (done) {
			var context = mock_context.instance();
			var to_process = { compare: { array: ['a', 'b'], operator: "==" } };
			try {
				var result = _compare.process.call(to_process, context);
				done("Should have failed");
			}
			catch (err) {
				done();
			}
		});
	});
});
