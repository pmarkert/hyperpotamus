var _pop = require("../../lib/actions/pop");
var _ = require("lodash");
var assert = require("assert");
var mock_context = require("../mock_context");
var validateVError = require("../test_utils/validate_verror");

describe("pop.js", () => {
	describe("normalize()", () => {
		it("should not exist", () => {
			assert(_.isNil(_pop.normalize));
		});
	});

	describe("process()", () => {
		describe(".key values", () => {
			function test(key) {
				var context = mock_context.instance({ array_key: ["a", "b", "c"], other: "element" });
				var result = _pop.process.call({ pop: { key, array: "array_key" } }, context);
				assert.equal(null, result, "Should have succeeded");
				assert.deepEqual(_.get(context.session, key), "c", "Popped value was not properly assigned");
			}

			function fail(key, error) {
				assert.throws(() => test(key), validateVError(error));
			}

			describe("should succeed given", () => {
				it("empty string", () => test(""));
				it("a normal key", () => test("key"));
				it("a dotted notation key", () => test("key.child"));
			});

			describe("should fail given", () => {
				it("true", () => fail(true, "InvalidActionValue.pop"));
				it("false", () => fail(false, "InvalidActionValue.pop"));
				it("null", () => fail(null, "InvalidActionValue.pop"));
				it("a date", () => fail(new Date(), "InvalidActionValue.pop"));
				it("an array", () => fail([], "InvalidActionValue.pop"));
				it("an object", () => fail({}, "InvalidActionValue.pop"));
			});
		});

		describe(".array values", () => {
			function test(array) {
				var context = mock_context.instance({
					array_key: ["a", "b", "c"],
					child: {
						nested_array: [ "c" ]
					},
					matrix: [ [ "a", "b" ], [ "d", "c" ], [ "e", "f" ] ],
					other: "element" }
				);
				var result = _pop.process.call({ pop: { key: "key", array } }, context);
				assert.equal(null, result, "Should have succeeded");
				assert.deepEqual(_.get(context.session, "key"), "c", "Popped value was not properly assigned");
			}

			function fail(array, error) {
				assert.throws(() => test(array), validateVError(error));
			}

			describe("should succeed given", () => {
				it("a proper array", () => test("array_key"));
				it("a key for a nested array", () => test("child.nested_array"));
				it("a key for an array inside of an array", () => test("matrix.1"));
			});

			describe("should fail given", () => {
				it("undefined", () => fail(undefined, "InvalidActionValue.pop"));
				it("null", () => fail(null, "InvalidActionValue.pop"));
				it("a key that doesn't exist", () => fail("nonexistent_array", "MissingKeyError"));
				it("a key that isn't for an array", () => fail("other", "InvalidActionValue.pop"));
			});
		});
	});
});
