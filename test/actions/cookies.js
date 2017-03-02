var _ = require("lodash");
var _cookies = require("../../lib/actions/cookies");
var assert = require("assert");
var mock_context = require("../mock_context");
var validateVError = require("../test_utils/validate_verror");
var Promise = require("bluebird");
var tough = require("tough-cookie");
_cookies.logger = require("../mock_logger");

describe("cookies.js", () => {
	describe("process()", () => {
		var input_cookie1 = { domain: "hyperpotamus.io", key: "_key", value: "_value" };
		var input_cookie2 = { domain: "hyperpotamus.io", key: "_key2", value: "_value2", path: "/special" };

		var output_cookie1 = { domain: "hyperpotamus.io", key: "_key", value: "_value", path: "/" };
		var output_cookie2 = { domain: "hyperpotamus.io", key: "_key2", value: "_value2", path: "/special" };

		describe("should succeed with", () => {
			function test(to_process, expected) {
				var context = mock_context.instance();
				var result = _cookies.process.call({ cookies: to_process }, context);
				return result.then(() => {
					var cookieStore = context.cookieStore();
					return Promise.promisify(cookieStore.getAllCookies, { context: cookieStore })()
						.then(cookies => {
							cookies.forEach(c => delete c.creation);
							assert.deepEqual(cookies, expected);
						});
				});
			}

			it("an empty array", () => test([], {}));
			it("a single cookie", () => test(input_cookie1, [output_cookie1]));
			it("a single cookie in an array", () => test([input_cookie1], [output_cookie1]));
			it("an array with 2 cookies", () => test([input_cookie1, input_cookie2], [output_cookie1, output_cookie2]));
		});
		
		describe("should fail with", () => {
			function test_failure(to_process, expected_failure) {
				var context = mock_context.instance();
				return _cookies.process.call({ cookies: to_process }, context)
					.then(() => {
						assert.fail("Should have thrown exception");
					}, err => {
						if(!validateVError(expected_failure)(err)) {
							throw err;
						}
					});
			}
			
			it("an empty cookie", () => test_failure({}, "InvalidCookie"));
			it("a missing value", () => test_failure({ domain: "hyperpotamus.io", key: "_key" }, "InvalidCookie"));
			it("a bad expiration", () => test_failure({ key: "_key", expires: "asdf" }, "InvalidCookie"));
		});
		
		describe("match tests", () => {
			function test(to_process, url, expected) {
				var context = mock_context.instance();
				var result = _cookies.process.call({ cookies: to_process }, context);
				return result.then(() => {
					var jar = new tough.CookieJar(context.cookieStore());
					return Promise.promisify(jar.getCookieString, { context: jar })(url)
						.then(result => {
							assert.equal(result, expected);
						});
				});
			}
			
			it("no cookies", () => test([], "http://hyperpotamus.io", ""));
			it("match one cookie", () => test([input_cookie1], "http://hyperpotamus.io", "_key=_value"));
			it("match two cookies", () => test([input_cookie1, input_cookie2], "http://hyperpotamus.io/special", "_key2=_value2; _key=_value"));
			it("match with null domain cookie", () => test([ { key: "a", value: "b" }], "http://hyperpotamus.io/special", "a=b"));
		});
	});
});
