var interpolate = require("../lib/interpolate");
var async = require("async");
var assert = require("assert");
var _ = require("underscore");

describe("String Interpolation", function() {

	var prefix = "PRE|", suffix = "|POST";

	describe("Normal Tokens", function(done) {
		var data = { token : "value" };
		var cases = [
			[ "<% token %>", "Whitespace both sides, option none" ],
			[ "<%= token %>", "Whitespace both sides, option equals" ],
			[ "<%=token%>", "No whitespace, option equals" ],
			[ "<%token%>", "No whitespace, option none" ],
			[ "<%token %>", "Trailing whitespace, option none" ],
			[ "<% token|none %>", "Whitespace, option none, dummy parameter" ],
			[ "<%token|none %>", "Trailing whitespace, dummy parameter" ],
			[ "<%token|none%>", "No whitespace, option none, dummy parameter" ],
			[ "<%=token|none%>", "No whitespace, option equals, dummy parameter" ],
		];

		async.each(cases, function(testcase, callback) { 
			it(testcase[1], function() {
				assert.equal("PRE|value|POST", interpolate("PRE|" + testcase[0] + "|POST", data));
				callback();
			});
		}, done);
	});

	describe("Url-Encode token", function(done) {
		var data = { token : "!@#$%^&*()-_=+\\|]}[{'\";:/?.>,<`~" };
		var encoded = encodeURIComponent(data.token);
		var cases = [
			[ encoded, "<%+ token %>", "Encode" ],
			[ encodeURIComponent(encoded),"<%++ token %>", "Encode encode" ],
			[ encoded, "<%++- token %>", "Encode encode decode" ],
			[ encoded, "<%+-+ token %>", "Encode decode encode" ],
			[ encoded, "<%-++ token %>", "Decode encode encode" ],
			[ data.token, "<%-++- token %>", "Decode encode encode decode" ],
		];

		async.each(cases, function(testcase, callback) {
			it(testcase[2], function() {
				assert.equal(prefix + testcase[0] + suffix, interpolate(prefix + testcase[1] + suffix, data));
				callback();
			});
		}, done);
	});

	describe("Url-Decode token", function(done) {
		var decoded = "!@#$%^&*()-_=+\\|]}[{'\";:/?.>,<`~";
		var data = { token : encodeURIComponent(decoded), double_encoded : encodeURIComponent(encodeURIComponent(decoded)) };
		var cases = [
			[ decoded, "<%- token %>", "Decode" ],
			[ decoded, "<%-- double_encoded%>", "Decode decode" ],
			[ decoded, "<%--+ token %>", "Decode decode encode" ],
			[ decoded, "<%-+- token %>", "Decode encode decode" ],
			[ decoded, "<%+-- token %>", "Encode decode decode" ],
			[ data.token, "<%+--+ token %>", "Encode decode decode encode" ],
		];

		async.each(cases, function(testcase, callback) {
			it(testcase[2], function() {
				assert.equal(prefix + testcase[0] + suffix, interpolate(prefix + testcase[1] + suffix, data));
				callback();
			});
		}, done);
	});

	describe("Optional token", function(done) {
		var data = { };
		var cases = [
			[ "", "<%? token %>", "Whitespace both sides, option optional" ],
                        [ "", "<%=? token %>", "Whitespace both sides, option equals, optional" ],
                        [ "", "<%?= token %>", "Whitespace both sides, option optional, equals" ],
                        [ "", "<%=?token%>", "No whitespace, option equals, optional" ],
                        [ "", "<%?=token%>", "No whitespace, option optional, equals" ],
                        [ "", "<%?token%>", "No whitespace, option optional" ],
                        [ "", "<%?token %>", "Trailing whitespace, option optional" ],
                        [ "default", "<%? token|default %>", "Whitespace, option optional, default" ],
                        [ "default", "<%?token|default %>", "Trailing whitespace, default" ],
                        [ "default", "<%?token|default%>", "No whitespace, option optional, default" ],
                        [ "default", "<%?=token|default%>", "No whitespace, option optional equals, default" ],
		];

		async.each(cases, function(testcase, callback) {
			it(testcase[2], function() {
				assert.equal(prefix + testcase[0] + suffix, interpolate(prefix + testcase[1] + suffix, data));
				callback();
			});
		}, done);
	});

        describe("Literal escape", function(done) {
		assert.equal("<%:? test|param %>", interpolate("<%%:? test|param %>"));
	});

	describe("Format the date", function(done) {
		var moment = require("moment")();

		var cases = [
			[ "<%: YYYY-MM-DD %>", "Whitespace both sides, option optional" ],
			[ "<%:= YYYY-MM-DD %>", "Whitespace both sides, option optional" ],
                        [ "<%:? YYYY-MM-DD %>", "Whitespace both sides, option equals, optional" ],
                        [ "<%?: YYYY-MM-DD %>", "Whitespace both sides, option optional, equals" ],
                        [ "<%:=? YYYY-MM-DD %>", "No whitespace, option equals, optional" ],
                        [ "<%:?= YYYY-MM-DD %>", "No whitespace, option optional, equals" ],
                        [ "<%?:= YYYY-MM-DD %>", "No whitespace, option optional" ],
                        [ "<%?=: YYYY-MM-DD %>", "Trailing whitespace, option optional" ],
                        [ "<%: YYYY-MM-DD|dummy %>", "Whitespace, option optional, default" ],
                        [ "<%:YYYY-MM-DD|dummy %>", "Trailing whitespace, default" ],
                        [ "<%:YYYY-MM-DD|dummy%>", "No whitespace, option optional, default" ],
		];

		async.each(cases, function(testcase, callback) {
			it(testcase[1], function() {
				assert.equal(prefix + moment.format("YYYY-MM-DD") + suffix, interpolate(prefix + testcase[0] + suffix, {}));
				callback();
			});
		}, done);
	});

	describe("Delimiter quote", function(done) {
		assert.equal("\"as,df\"", interpolate("<%# value %>", { value : "as,df" }));
		assert.equal("as,df", interpolate("<%# value|; %>", { value : "as,df" }));
		assert.equal("\"as;df\"", interpolate("<%# value|; %>", { value : "as;df" }));
		assert.equal("asdf", interpolate("<%# value %>", { value : "asdf" }));
	});

	function verify_random_range(str, min, max, count) {
		// Because this test is inherently "random" (which is bad for unit tests), 
		// let's do it many times to lower the probability of false negative.
		for(var i=0; i<(count || 100); i++) { 
			var result = interpolate(str);
			var int_result = parseInt(result);
			assert(_.isNumber(int_result), "Result was not a number - " + result);
			assert.equal(int_result, result, "Result did not seem to be an integer - " + result);
			assert(int_result >= min , "Number was too low - " + result);
			assert(int_result < max, "Number was too high - " + result);
		}
	}

	describe("Random numbers", function() {
		it("Should generate a random number within a range", function() {
			var min = 3, max=7;
			verify_random_range("<%$ " + min + "-" + max + " %>", min, max);
		});
		it("Should generate a random number within a range and whitespace", function() {
			var min = 3, max=7;
			verify_random_range("<%$ " + min + " - " + max + " %>", min, max);
		});
		it("Should throw an error if min == max", function() {
			var min = 3, max=3;
			try {
				verify_random_range("<%$ " + min + " - " + max + " %>", min, max, 1);
				assert.fail("Should have thrown an error");
			} catch(err) { };
		});
		it("Should throw an error if min > max", function() {
			var min = 4, max=3;
			try {
				verify_random_range("<%$ " + min + " - " + max + " %>", min, max, 1);
				assert.fail("Should have thrown an error");
			} catch(err) { };
		});
		it("Should generate a random number from X -> X+1 (same number)", function() {
			var min = 3, max=4;
			verify_random_range("<%$ " + min + " - " + max + " %>", min, max);
		});
		it("Should generate a random number from 0 to max-1", function() {
			var max = 7;
			verify_random_range("<%$ " + max + " %>", 0, max);
		});
	});

	describe("Random array elements", function() {
		it("Should return a random element from an array", function() {
			var array = [ "one", "two", "three" ];
			// Because this test is inherently "random" (which is bad for unit tests), 
			// let's do it many times to lower the probability of false negative.
			for(var i=0; i<100; i++) {
				var result = interpolate("<%$@ array %>", { array : array });
				assert(_.contains(array, result));
			}
		});

		it("Should return the single element from a single-element array", function() {
			var array = [ "one" ];
			// Because this test is inherently "random" (which is bad for unit tests), 
			// let's do it many times to lower the probability of false negative.
			for(var i=0; i<100; i++) {
				var result = interpolate("<%$@ array %>", { array : array });
				assert(_.contains(array, result));
			}
		});

		it("Should return the element from a non array", function() {
			var array = "one";
			// Because this test is inherently "random" (which is bad for unit tests), 
			// let's do it many times to lower the probability of false negative.
			for(var i=0; i<100; i++) {
				var result = interpolate("<%$@ array %>", { array : array });
				assert.equal(array, result);
			}
		});
	});

	describe("Multiple tokens", function() {
		it("Process all tokens", function() {
			var data = { one : "1", two : "2" };
			assert.equal(prefix + "1,2" + suffix, interpolate(prefix + "<%=one%>,<%=two%>" + suffix, data));
		});
	});

        describe("Array access", function() {
		var array = [ "one", "two", "three" ];
		var value = "replaced";
		it("First element", function() {
			assert.equal(prefix + array[0] + suffix, interpolate(prefix + "<%@ array %>" + suffix, { array : array, "array.index" : 0 }));
		});
		it("Third element", function() {
			assert.equal(prefix + array[2] + suffix, interpolate(prefix + "<%@ array %>" + suffix, { array : array, "array.index" : 2 }));
		});
		it("Out of bounds", function() {
			try {
			  interpolate(prefix + "<%@ array %>" + suffix, { array : array, "array.index" : 2 });
			  assert.fail("Should have thrown an error");
			 } catch(err) {
			 	// Noop
			 }
		});
		it("Non-array", function() {
			assert.equal(prefix + value + suffix, interpolate(prefix + "<%@ value %>" + suffix, { value: value }));
		});
		it("Non-array, fake index", function() {
			assert.equal(prefix + value + suffix, interpolate(prefix + "<%@ value %>" + suffix, { value: value }));
		});
		it("Array specific indexing, 0", function() {
			assert.equal("one", interpolate("<%@ array|0 %>", { array : array }));
		});
		it("Array specific indexing, 1", function() {
			assert.equal("two", interpolate("<%@ array|1 %>", { array : array }));
		});
		it("Array specific indexing, 2", function() {
			assert.equal("three", interpolate("<%@ array|2 %>", { array : array }));
		});
		it("Array specific indexing, 3 (out of bounds)", function() {
			try {
				interpolate("<%@ array|3 %>", { array : array });
				assert.fail("Should have thrown an error");
			} catch(err) {
				// Noop
			}
		});
	});

	describe("Array join", function() {
		var array = [ "one", "two", "three" ];
		it("Comma-delimited", function() {
			assert.equal("one,two,three", interpolate("<%& array|, %>", { array: array }));
		});
		it("Pipe-delimited", function() {
			assert.equal("one|two|three", interpolate("<%& array|| %>", { array: array }));
		});
		it("Default delimiter", function() {
			assert.equal("one,two,three", interpolate("<%& array %>", { array: array }));
		});
		it("Tab delimiter", function() {
			assert.equal("one	two	three", interpolate("<%& array|\\t %>", { array: array }));
		});
		it("Space delimiter", function() {
			assert.equal("one two three", interpolate("<%& array|\\s %>", { array: array }));
		});
	});
});
