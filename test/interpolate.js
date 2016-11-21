var interpolate = require("../lib/interpolate");
var async = require("async");
var assert = require("assert");
var _ = require("lodash");

describe("String Interpolation", function() {

	var prefix = "PRE|", suffix = "|POST";

	describe("Normal Tokens", function(done) {
		var data = { token : "value" };
		var cases = [
			[ "<% token %>", "Whitespace both sides" ],
			[ "<%token%>", "No whitespace" ],
			[ "<%token %>", "Trailing whitespace" ]
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
			[ encoded, "<% token | urlencode %>", "Encode" ],
			[ encodeURIComponent(encoded),"<% token | urlencode | urlencode %>", "Encode encode" ],
			[ encoded, "<% token | urlencode | urlencode | urldecode %>", "Encode encode decode" ],
			[ data.token, "<% token | urlencode | urldecode %>", "Encode decode" ],
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
			[ "", "<% token | optional %>", "Optional" ],
                        [ "default", "<% token | optional,default %>", "Option optional, default" ],
		];

		async.each(cases, function(testcase, callback) {
			it(testcase[2], function() {
				assert.equal(prefix + testcase[0] + suffix, interpolate(prefix + testcase[1] + suffix, data));
				callback();
			});
		}, done);
	});

	describe("Format the date", function(done) {
		var moment = require("moment");
		var data = { the_date : moment() };

		var cases = [
			[ "<% the_date | date_format,YYYY-MM-DD %>", "date_format" ]
		];

		async.each(cases, function(testcase, callback) {
			it(testcase[1], function() {
				assert.equal(prefix + data.the_date.format("YYYY-MM-DD") + suffix, interpolate(prefix + testcase[0] + suffix, data));
				callback();
			});
		}, done);
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
			assert(int_result <= max, "Number was too high - " + result);
		}
	}

	describe("Random numbers", function() {
		it("Should generate a random number within a range", function() {
			var min = 3, max=7;
			verify_random_range("<% '" + min + "-" + max + "' | random %>", min, max);
		});
		it("Should generate a random number within a range and whitespace", function() {
			var min = 3, max=7;
			verify_random_range("<% '" + min + "-" + max + "' | random %>", min, max);
		});
		it("Should return the number if min == max", function() {
			var min = 3, max=3;
			verify_random_range("<% '" + min + "-" + max + "' | random %>", min, max);
		});
		it("Should throw an error if min > max", function(callback) {
			var min = 4, max=3;
			try {
				verify_random_range("<% '" + min + "-" + max + "' | random %>", min, max);
				assert.fail("Should have thrown an error");
			} catch(err) { callback(); };
		});
		it("Should generate a random number from X -> X+1 (same number)", function() {
			var min = 3, max=4;
			verify_random_range("<% '" + min + "-" + max + "' | random %>", min, max);
		});
		it("Should generate a random number from 0 to max-1", function() {
			var max = 7;
			verify_random_range("<% '" + max + "' | random %>", 0, max);
		});
	});

	describe("Random array elements", function() {
		it("Should return a random element from an array", function() {
			var array = [ "one", "two", "three" ];
			// Because this test is inherently "random" (which is bad for unit tests), 
			// let's do it many times to lower the probability of false negative.
			for(var i=0; i<100; i++) {
				var result = interpolate("<% array | random %>", { array : array });
				assert(_.includes(array, result));
			}
		});

		it("Should return the single element from a single-element array", function() {
			var array = [ "one" ];
			// Because this test is inherently "random" (which is bad for unit tests), 
			// let's do it many times to lower the probability of false negative.
			for(var i=0; i<100; i++) {
				var result = interpolate("<% array | random %>", { array : array });
				assert(_.includes(array, result));
			}
		});

		it("Should return the element from a non array", function() {
			var array = "1";
			// Because this test is inherently "random" (which is bad for unit tests), 
			// let's do it many times to lower the probability of false negative.
			for(var i=0; i<100; i++) {
				var result = interpolate("<% array | random %>", { array : array + "-" + array });
				assert.equal(array, result);
			}
		});
	});

	describe("Multiple tokens", function() {
		it("Process multiple tokens", function() {
			var data = { one : "1", two : "2" };
			assert.equal(prefix + "1,2" + suffix, interpolate(prefix + "<% one %>,<% two %>" + suffix, data));
		});
	});

        describe("Array access", function() {
		var array = [ "one", "two", "three" ];
		var value = "replaced";
		it("First element", function() {
			assert.equal(prefix + array[0] + suffix, interpolate(prefix + "<% array.0 %>" + suffix, { array : array, "array.index" : 0 }));
		});
		it("Third element", function() {
			assert.equal(prefix + array[2] + suffix, interpolate(prefix + "<% array.2 %>" + suffix, { array : array, "array.index" : 2 }));
		});
		it("Out of bounds", function() {
			try {
			  interpolate(prefix + "<% array.2 %>" + suffix, { array : array });
			  assert.fail("Should have thrown an error");
			 } catch(err) {
			 	// Noop
			 }
		});
		it("Non-array", function() {
			assert.equal(prefix + value + suffix, interpolate(prefix + "<% value | current %>" + suffix, { value: value }));
		});
		it("Non-array, fake index", function() {
			assert.equal(prefix + value + suffix, interpolate(prefix + "<% value | current %>" + suffix, { value: value }));
		});
	});

	describe("Array join", function() {
		var array = [ "one", "two", "three" ];
		it("Comma-delimited", function() {
			assert.equal("one,two,three", interpolate("<% array | join %>", { array: array }));
		});
		it("Pipe-delimited", function() {
			assert.equal("one|two|three", interpolate("<% array| join_pipe %>", { array: array }));
		});
		it("Default delimiter", function() {
			assert.equal("onetwothree", interpolate("<% array %>", { array: array }));
		});
		it("Tab delimiter", function() {
			assert.equal("one	two	three", interpolate("<% array | join,	%>", { array: array }));
		});
		it("Space delimiter", function() {
			assert.equal("one two three", interpolate("<% array | join, %>", { array: array }));
		});
	});
});
