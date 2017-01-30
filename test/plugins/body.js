var _body = require("../../lib/plugins/body");
var _ = require("lodash");
var assert = require("assert");
var validateVError = require("../lib/validate_verror");
var mock_context = require("../mock_context");

describe("body plugin", () => {
	describe("normalize", () => {
		it("should not normalize", () => {
			assert(_.isNil(_body.normalize));
		});
	});

	describe("process", (body) => {
		function test() {
			var context = mock_context.instance();
			context.response = true;
			context.body = body;
			var key_name = "target_key";
			var result = _body.process.call({ body: key_name }, context);
			assert.equal(null, result, "Should have succeeded");
			assert.deepEqual(context.body, context.session[key_name], "Body value was not properly assigned");
		}

		function testFailure(body_value) {
			var context = mock_context.instance();
			context.response = "mock";
			assert.throws(() => _body.process.call({ body: body_value }, context), validateVError("InvalidActionValue.body"));
		}

		it("should process and save textual body contents to the session", () => {
			test("the body");
		});

		it("should process and save json/object body contents to the session", () => {
			test({ response_body: "the body", mock_json_object: "from the response" });
		});

		it("should fail when .body property is null", function () {
			testFailure(null);
		});
		it("should fail when .body property is true", function () {
			testFailure(true);
		});
		it("should fail when .body property is false", function () {
			testFailure(false);
		});
		it("should fail when .body property is a date", function () {
			testFailure(new Date());
		});
		it("should fail when .body property is a number", function () {
			testFailure(3);
		});
		it("should fail when .body property is an array", function () {
			testFailure([]);
		});
		it("should fail when .body property is an object", function () {
			testFailure({});
		});

		it("should fail when not used as a response action", function () {
			assert.throws(() => _body.process.call({ body: "target_key" }, mock_context.instance()), validateVError("InvalidActionPlacement.body"));
		});
	});
});
