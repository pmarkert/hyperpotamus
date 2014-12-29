var interpolate = require("../lib/interpolate");
var async = require("async");
var assert = require("assert");

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
			[ "<% token:none %>", "Whitespace, option none, dummy parameter" ],
			[ "<%token:none %>", "Trailing whitespace, dummy parameter" ],
			[ "<%token:none%>", "No whitespace, option none, dummy parameter" ],
			[ "<%=token:none%>", "No whitespace, option equals, dummy parameter" ],
		];

		async.each(cases, function(testcase, callback) { 
			it("Should process " + testcase[1], function() {
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
			it("Should process " + testcase[2], function() {
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
			it("Should process " + testcase[2], function() {
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
                        [ "default", "<%? token:default %>", "Whitespace, option optional, default" ],
                        [ "default", "<%?token:default %>", "Trailing whitespace, default" ],
                        [ "default", "<%?token:default%>", "No whitespace, option optional, default" ],
                        [ "default", "<%?=token:default%>", "No whitespace, option optional equals, default" ],
		];

		async.each(cases, function(testcase, callback) {
			it("Should process " + testcase[2], function() {
				assert.equal(prefix + testcase[0] + suffix, interpolate(prefix + testcase[1] + suffix, data));
				callback();
			});
		}, done);
	});

	describe("Should format the date", function(done) {
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
                        [ "<%: YYYY-MM-DD:dummy %>", "Whitespace, option optional, default" ],
                        [ "<%:YYYY-MM-DD:dummy %>", "Trailing whitespace, default" ],
                        [ "<%:YYYY-MM-DD:dummy%>", "No whitespace, option optional, default" ],
		];

		async.each(cases, function(testcase, callback) {
			it("Should process " + testcase[1], function() {
				assert.equal(prefix + moment.format("YYYY-MM-DD") + suffix, interpolate(prefix + testcase[0] + suffix, {}));
				callback();
			});
		}, done);
	});

	describe("Multiple tokens", function() {
		it("Should process all tokens", function() {
			var data = { one : "1", two : "2" };
			assert.equal(prefix + "1,2" + suffix, interpolate(prefix + "<%=one%>,<%=two%>" + suffix, data));
		});
	});
});
