var _ = require("lodash");
var _request_defaults = require("../../lib/actions/request_defaults");
var assert = require("assert");
var mock_context = require("../mock_context");
var normalizer = require("../mock_normalizer");
var validateVError = require("../test_utils/validate_verror");
_request_defaults.logger = require("../mock_logger");

describe("request_defaults.js", () => {
	var unqualified_input = { headers: { header1: "value1" } };
	var unqualified_normalized = { domain: "*", key: "request_defaults", path: "/", value: { headers: { header1: "value1" } } };
	
	var qualified_input = { domain: "hyperpotamus.io", path: "/", value: { headers: { header1: "value1" } } };
	var qualified_aliased_input = { domain: "hyperpotamus.io", path: "/", request: { headers: { header1: "value1" } } };
	var qualified_normalized = { domain: "hyperpotamus.io", key: "request_defaults", path: "/", value: { headers: { header1: "value1" } } };
	
	describe("normalize()", () => {
		
		describe("should succesfully normalize", () => {
			function test(to_normalize, expected) {
				var result = _request_defaults.normalize({ request_defaults: _.cloneDeep(to_normalize) }, normalizer, "path");
				assert(_.isPlainObject(result), "Should have returned a plain object");
				assert.deepEqual(result, { request_defaults: expected });
			}

			it("an empty array", () => test([], []));
			it("a single unqualified item", () => test([ unqualified_input], [ unqualified_normalized ]));
			it("a single qualified item", () => test([ qualified_input], [ qualified_normalized ]));
			it("a single qualified, aliased item", () => test([ qualified_aliased_input], [ qualified_normalized ]));
		});

		describe("should not normalize", () => {
			function test(to_normalize) {
				assert(_request_defaults.normalize(to_normalize, normalizer) == null);
			}

			it("null", () => test(null));
			it("integer", () => test(3));
			it("string", () => test("String"));
			it("true", () => test(true));
			it("false", () => test(false));
			it("Date", () => test(new Date()));
			it("an object without .and", () => test({ object: true }));
		});

		describe("should throw an error for invalid actions", () => {
			function test(to_normalize) {
				assert.throws(() => _request_defaults.normalize(to_normalize, normalizer), validateVError("ActionStructureError.request_defaults"), "Should have thrown an error, but didn't.");
			}

			it("element has both .value and .request", () => test({ request_defaults: { value: {}, request: {} } }));
			it("request_defaults is a string", () => test({ request_defaults: "string" }));
			it("request_defaults is a boolean", () => test({ request_defaults: true }));
		});
	});
	
	describe("process()", () => {
		describe("should succeed with", () => {
			function test(to_process, expected) {
				var context = mock_context.instance();
				var result = _request_defaults.process.call({ request_defaults: to_process }, context);
				return result.then(() => {
					var requestDefaults = context.requestDefaultsStore();
					return requestDefaults.getAllCookiesPromise()
						.then(request_defaults => {
							request_defaults.forEach(c => delete c.creation);
							assert.deepEqual(request_defaults, expected);
						});
				});
			}

			it("an empty array", () => test([], []));
			it("a single request_default", () => test([unqualified_normalized], [unqualified_normalized]));
			it("multiple request_defaults", () => test([unqualified_normalized, qualified_normalized], [unqualified_normalized, qualified_normalized]));
		});
	});
});
