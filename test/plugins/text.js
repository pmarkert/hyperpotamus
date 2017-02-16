var _text = require("../../lib/actions/text");
var _ = require("lodash");
var assert = require("assert");
var validateVError = require("../lib/validate_verror");
var mock_context = require("../mock_context");

describe("text.js", () => {
	describe("normalize()", () => {
	});

	describe("process()", () => {
		describe("with different response types", () => {
			function test(text, body) {
				var context = mock_context.instance();
				context.response = { body };
				context.body = body;
				var result = _text.process.call({ text }, context);
				assert.equal(null, result, "Should have succeeded");
			}

			describe("should succeed given", () => {
				it("a match", () => test("foo", "this is a foo bar bat response"));
				it("an exact match", () => test("foo", "foo"));
				it("a match at the beginning", () => test("foo", "foo bar bat response"));
				it("a match at the end", () => test("foo", "foo bar"));
				it("a phrase", () => test("foo bar", "this is a foo bar bat response"));
			});
			
			describe("should fail given", () => {
				function fail(text, body, error) {
					assert.throws(() => test(text, body), validateVError(error));
				}
				
				it("an unmatched string", () => fail("baz", "this is a foo bar bat response", "TextNotFoundInResponse"));
				it("null for .text", () => fail(null, "this is a foo bar bat response", "InvalidActionValue.text"));
				it("undefined for .text", () => fail(undefined, "this is a foo bar bat response", "InvalidActionValue.text"));
				it("a number for .text", () => fail(3, "this is a foo bar bat response", "InvalidActionValue.text"));
				it("a date for .text", () => fail(new Date(), "this is a foo bar bat response", "InvalidActionValue.text"));
				it("an object for .text", () => fail({}, "this is a foo bar bat response", "InvalidActionValue.text"));
				it("an array for .text", () => fail([], "this is a foo bar bat response", "InvalidActionValue.text"));
			});
		});

		it("should fail when not used inside of a request/response action", function () {
			assert.throws(() => _text.process.call({ text: "target_key" }, mock_context.instance()), validateVError("InvalidActionPlacement.text"));
		});
	});
});
