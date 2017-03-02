var _fail = require("../../lib/actions/fail");
var _ = require("lodash");
var assert = require("assert");
var validateVError = require("../test_utils/validate_verror");

describe("fail.js", () => {
	describe("normalize()", () => {
		describe("should succesfully normalize", () => {
			function test(to_normalize, expected_message) {
				var result = _fail.normalize(to_normalize);
				assert(result!=null, "Should have returned a normalized object");
				assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
				assert.equal(result.fail, expected_message, "Should have had a .and property that is an array");
			}

			it("false", () => test(false, "Explicit false"));
			it("a failure action", () => test({ fail: "message" }, "message"));
		});

		describe("should not normalize", () => {
			function test(to_normalize) {
				assert(_fail.normalize(to_normalize) == null);
			}

			it("null", () => test(null));
			it("integer", () => test(3));
			it("string", () => test("String"));
			it("true", () => test(true));
			it("Date", () => test(new Date()));
			it("an object without .fail", () => test({ object: true }));
		});

		describe("should throw an error for invalid actions", () => {
			function test(to_normalize) {
				assert.throws(() => _fail.normalize(to_normalize), validateVError("ActionStructureError.fail"));
			}

			it(".fail is true", () => test({ fail: true }));
			it(".fail is false", () => test({ fail: false }));
			it(".fail is a number", () => test({ fail: 3 }));
			it(".fail is null", () => test({ fail: null }));
			it(".fail is an array", () => test({ fail: [] }));
			it(".fail is an object", () => test({ fail: {} }));
			it(".fail is a date", () => test({ fail: new Date() }));
		});
		
	});

	describe("process()", () => {
		function test(fail_action, expected_message) {
			assert.throws(() => { _fail.process.call(fail_action); }, (err) => err.message==expected_message);
		}
		
		it("should fail with a specific message", () => test({ fail: "Message here" }, "Message here"));
	});
});
