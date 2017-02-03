var _body = require("../../lib/plugins/body");
var _ = require("lodash");
var assert = require("assert");
var validateVError = require("../lib/validate_verror");
var mock_context = require("../mock_context");

describe("body.js", () => {
	describe("normalize()", () => {
		it("should not exist", () => {
			assert(_.isNil(_body.normalize));
		});
	});

	describe("process()", () => {
		describe("should save the response body contents to the session, given the response body content as", () => {
			function test(body) {
				var context = mock_context.instance();
				context.response = true;
				context.body = body;
				var key_name = "target_key";
				var result = _body.process.call({ body: key_name }, context);
				assert.equal(null, result, "Should have succeeded");
				assert.deepEqual(context.body, context.session[key_name], "Body value was not properly assigned");
			}

			it("a string", () => test("the body"));
			it("an empty string", () => test(""));
			it("null", () => test(null));
			it("a json object", () => test({ response_body: "the body", mock_json_object: "from the response" }));
		});

		describe("should fail when the .body property is", () => {
			function test(body) {
				var context = mock_context.instance();
				context.response = "mock";
				assert.throws(() => _body.process.call({ body }, context), validateVError("InvalidActionValue.body"));
			}

			it("null", () => test(null));
			it("true", () => test(true));
			it("false", () => test(false));
			it("a date", () => test(new Date()));
			it("a number", () => test(3));
			it("an array", () => test([]));
			it("an object", () => test({}));
		});
		
		it("should fail when not used inside of a request/response action", function () {
			assert.throws(() => _body.process.call({ body: "target_key" }, mock_context.instance()), validateVError("InvalidActionPlacement.body"));
		});
	});
});
