var _ = require("lodash");
var assert = require("assert");
var Promise = require("bluebird");
var cookieStore = require("../../lib/cookieStore");

describe("cookieStore.js", () => {
	function test(cookiesToAdd, domain, path, expectedCookies) {
		expectedCookies = _.map(expectedCookies, e => {
			e = _.clone(e);
			if (e.domain == "*") {
				e.domain = domain;
			}
			return e;
		});
		var store = new cookieStore();
		store = Promise.promisifyAll(store);
		return Promise.mapSeries(cookiesToAdd, c => store.putCookieAsync(c))
			.then(() => store.findCookiesAsync(domain, path))
			.then(results => {
				assert.deepEqual(results, expectedCookies);
			});
	}
	
	var hyperpotamus_root = { domain: "hyperpotamus.io", path: "/", key: "key", value: "value" };
	var hyperpotamus_pathed = { domain: "hyperpotamus.io", path: "/pathed", key: "key", value: "value" };
	var universal_root = { domain: "*", path: "/", key: "key", value: "value" };
	var universal_pathed = { domain: "*", path: "/pathed", key: "key", value: "value" };
	var other_root = { domain: "other.com", path: "/", key: "key", value: "value" };
	var other_pathed = { domain: "other.com", path: "/pathed", key: "key", value: "value" };

	var request_default = { domain: "hyperpotamus.io", key: "request_defaults", path: "/", value: { headers: { header1: "value1" } } };

	it("no cookies", () => test([], "hyperpotamus.io", "/", []));
	it("root, matched", () => test([hyperpotamus_root], "hyperpotamus.io", "/", [hyperpotamus_root]));
	it("root, matched and universal", () => test([hyperpotamus_root, universal_root], "hyperpotamus.io", "/", [hyperpotamus_root, universal_root]));
	it("root, all cookies", () => test([ hyperpotamus_root, hyperpotamus_pathed, universal_root, universal_pathed, other_root, other_pathed], "hyperpotamus.io", "/", [hyperpotamus_root, universal_root]));
	it("pathed, all cookies", () => test([ hyperpotamus_root, hyperpotamus_pathed, universal_root, universal_pathed, other_root, other_pathed], "hyperpotamus.io", "/pathed", [hyperpotamus_root, hyperpotamus_pathed, universal_root, universal_pathed]));
	it("root, unmatched domain, all cookies", () => test([ hyperpotamus_root, hyperpotamus_pathed, universal_root, universal_pathed, other_root, other_pathed], "nonmatched.com", "/", [universal_root]));
	it("pathed, unmatched domain, all cookies", () => test([ hyperpotamus_root, hyperpotamus_pathed, universal_root, universal_pathed, other_root, other_pathed], "nonmatched.com", "/pathed", [universal_root, universal_pathed]));
	it("root, unmatched domain, mismatched cookies", () => test([ hyperpotamus_root, hyperpotamus_pathed, other_root, other_pathed], "nonmatched.com", "/", []));
	it("pathed, unmatched domain, mismatched cookies", () => test([ hyperpotamus_root, hyperpotamus_pathed, other_root, other_pathed], "nonmatched.com", "/special", []));
	
	it("a request_default object (instead of a true cookie)", () => test([ request_default ], "hyperpotamus.io", "/", [ request_default ]));
});
