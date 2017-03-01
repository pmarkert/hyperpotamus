var _delay = require("../../lib/actions/delay");
var _ = require("lodash");
var assert = require("assert");
var validateVError = require("../lib/validate_verror");
var mock_context = require("../mock_context");

describe("delay.js", () => {
	describe("normalize()", () => {
		it("should not exist", () => {
			assert(_.isNil(_delay.normalize));
		});
	});

	describe("process()", () => {
		describe("Valid values", () => {
			function test(delay) {
				var context = mock_context.instance();
				return _delay.process.call({ delay }, context)
					.then((result) => {
						assert.equal(null, result, "Should have succeeded with no result");
					});
			}
			
			it("value=0 (number)", () => test(0));
			it("value=1 (number)", () => test(1));
			it("value=100 (number)", () => test(100));
		});

		describe("invalid types", () => {
			function test(delay) {
				var context = mock_context.instance();
				assert.throws(() => _delay.process.call({ delay }, context)
					.then(() => {
						throw "Expected an error to be returned.";
					}, validateVError("InvalidActionValue.delay")));
			}

			it("value='0' (string)", () => test("0"));
			it("value='1' (string)", () => test("1"));
			it("value=true", () => test(true));
			it("value=false", () => test(false));
			it("value=-1 (number)", () => test(-1));
			it("value=null", () => test(null));
		});
	});
});
