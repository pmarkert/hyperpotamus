var _push = require("../../lib/actions/push");
var _ = require("lodash");
var assert = require("assert");
var mock_context = require("../mock_context");
var validateVError = require("../test_utils/validate_verror");

describe("push.js", () => {
	describe("normalize()", () => {
		describe("should succesfully normalize", () => {
			function test(to_normalize, expected) {
				var result = _push.normalize(to_normalize);
				assert(result!=null, "Should have returned a normalized object");
				assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
				assert.deepEqual(result.push, expected);
			}

			it("a regular push action", () => test({ push: { value: true, array: [ ] } }, { value: true, array: [] } ));
			it("using the .target alias", () => test({ push: { value: true, target: [ ] } }, { value: true, array: [] } ));
		});

		describe("should not normalize", () => {
			function test(to_normalize) {
				assert(_push.normalize(to_normalize) == null);
			}

			it("null", () => test(null));
			it("integer", () => test(3));
			it("string", () => test("String"));
			it("true", () => test(true));
			it("Date", () => test(new Date()));
			it("an object without .push", () => test({ object: true }));
		});

		describe("should throw an error for invalid actions", () => {
			function test(to_normalize) {
				assert.throws(() => _push.normalize(to_normalize), validateVError("ActionStructureError.push"));
			}

			it("both .target and .array specified", () => test({ push: { array: true, target: true, value: true } }));
		});
	});
	
	// TODO - Missing .process() tests
});
