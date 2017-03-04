var _body = require("../../lib/actions/body");
var _ = require("lodash");
var assert = require("assert");
var validateVError = require("../test_utils/validate_verror");
var mock_context = require("../mock_context");

describe("body.js", () => {
	describe("normalize()", () => {
		it("should not exist", () => {
			assert(_.isNil(_body.normalize));
		});
	});

	describe("process()", () => {
		describe("with different response types", () => {
			function test(body) {
				var context = mock_context.instance();
				context.setSessionValue("hyperpotamus.response", { body });
				var key_name = "target_key";
				var result = _body.process.call({ body: key_name }, context);
				assert.equal(null, result, "Should have succeeded");
				assert.deepEqual(body, _.get(context.session, key_name), "Body value was not properly assigned");
			}

			describe("should succeed given", () => {
				it("a string", () => test("the body"));
				it("an empty string", () => test(""));
				it("a json object", () => test({ mock_json_object: "from the response", response_body: "the body"}));
			});
			
			describe("should fail give", () => {
				it("null", () => assert.throws(() => test(null), validateVError("NullResponseBody")));
			});

			describe("different .body values", () => {
				function test(key_name) {
					var context = mock_context.instance();
					context.setSessionValue("hyperpotamus.response", { body: "value" });
					var result = _body.process.call({ body: key_name }, context);
					assert.equal(null, result, "Should have succeeded");
					assert.deepEqual("value", _.get(context.session, key_name), "Body value was not properly assigned");
				}

				describe("should succeed given", () => {
					it("an empty string", () => test(""));
					it("normal key", () => test("body"));
					it("dotted notaion key", () => test("body.value"));
				});

				describe("should fail given", () => {
					function fail(body, error) {
						assert.throws(() => test(body), validateVError(error));
					}

					it("null", () => fail(null, "InvalidActionValue.body"));
					it("true", () => fail(true, "InvalidActionValue.body"));
					it("false", () => fail(false, "InvalidActionValue.body"));
					it("a date", () => fail(new Date(), "InvalidActionValue.body"));
					it("a number", () => fail(3, "InvalidActionValue.body"));
					it("an array", () => fail([], "InvalidActionValue.body"));
					it("an object", () => fail({}, "InvalidActionValue.body"));
				});
			});
		});

		it("should fail when not used inside of a request/response action", function () {
			assert.throws(() => _body.process.call({ body: "target_key" }, mock_context.instance()), validateVError("InvalidActionPlacement.body"));
		});
	});
});
