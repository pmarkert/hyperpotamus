var _body = require("../../lib/plugins/body");
var assert = require("assert");
var mock_context = require("../mock_context");

describe("body plugin", function () {
	describe("process", function () {
		it("should process", function (done) {
			var context = mock_context.instance();
			var key_name = "Target_key";
			context.body = "the body";
			context.response = true;
			var to_process = { body: key_name };
			try {
				var result = _body.process.call(to_process, context);
				assert.equal(null, result, "Should have succeeded");
				assert.deepEqual(context.body, context.session[key_name], "Processed actions should have matched");
				done();
			}
			catch (err) {
				done(err);
			}
		});

		it("should fail when not used as a response action", function (done) {
			var context = mock_context.instance();
			var key_name = "Target_key";
			var to_process = { body: key_name };
			try {
				var result = _body.process.call(to_process, context);
				assert.notEqual(result, null, "Should have failed");
			}
			catch (err) {
				if(err && err.message && err.message.indexOf("response")>=0) done();
				else done(err);
			}
		});
	});
});
