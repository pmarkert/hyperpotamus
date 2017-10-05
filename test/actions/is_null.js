var _is_null = require("../../lib/actions/is_null");
var assert = require("assert");
var validateVError = require("../test_utils/validate_verror");
var mock_context = require("../mock_context");
var _ = require("lodash");

describe("is_null.js", () => {
	describe("normalize()", () => {
		describe("should succesfully normalize", () => {
			function test(to_normalize, expected_output) {
				var result = _is_null.normalize(to_normalize);
				assert(result != null, "Should have returned a normalized object");
				assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
				assert.deepEqual(result, expected_output, "Normalization output did not match");
			}

			it("is_null", () => test({ is_null: "key" }, { is_null: "key"}));
			it("is_nil alias", () => test({ is_nil: "key" }, { is_null: "key"}));
		});

		describe("should not normalize", () => {
			function test(to_normalize) {
				assert(_is_null.normalize(to_normalize) == null);
			}

			it("null", () => test(null));
			it("integer", () => test(3));
			it("string", () => test("String"));
			it("true", () => test(true));
			it("Date", () => test(new Date()));
			it("an object without .is_null, .set, or .merge", () => test({ object: true }));
		});

		describe("should throw an error for invalid actions", () => {
			function test(to_normalize) {
				assert.throws(() => _is_null.normalize(to_normalize), validateVError("ActionStructureError.is_null"));
			}

			it("has both _is_null and _is_nil", () => test({ is_null: "true", is_nil: "true" }));
		});
	});

	describe("process()", () => {
		function test(is_null, session) {
			var context = mock_context.instance(session);
			var result = _is_null.process.call({ is_null }, context);
			assert.equal(null, result, "Should have succeeded");
		}

		describe("should succeed given", () => {
			it("a key that doesn't exist", () => test("bat", { foo: "bar" }));
			it("a key that points to null", () => test("bat", { foo: "bar", bat: null }));
			it("a key that points to undefined", () => test("bat", { foo: "bar", bat: undefined }));
		});
		
		describe("should fail given", () => {
			function fail(is_null, session, error) {
				assert.throws(() => test(is_null, session), validateVError(error));
			}
			
			it("a key with a value", () => fail("foo", { foo: "bar" }, "ValueIsNotNull"));
		});
	});
});
