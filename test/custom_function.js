var hyperpotamus = require("../lib/index").processor();
describe("Custom function validation", function() {
	before(function(done) {
                server = require("./httpsite").listen(3000, done);
        });
        after(function() {
                server.close();
        });
	it("Should allow successful validation", function(done) {
		var script = {
			request: "http://localhost:3000/static/test.html",
			response: {
				custom_function: function(context, callback) {
					if(context.body.indexOf("is a test")>=0) {
						context.session["matched"] = true;
						return callback();
					}
					else {
						return callback("Did not find the match");
					}
				}
			}
		}
		hyperpotamus.process(script, {}, function(err, session) {
			if(session["matched"]) return done();
			else return done("Didn't find matched element in session");
		});
	});
	it("Should allow a failed validation", function(done) {
		var script = {
			request: "http://localhost:3000/static/test.html",
			response: {
				custom_function: function(context, callback) {
					if(context.body.indexOf("do not match")>=0) {
						context.session["matched"] = true;
						return callback();
					}
					else {
						return callback("Did not find the match");
					}
				}
			}
		}
		hyperpotamus.process(script, {}, function(err, session) {
			if(err) return done();
			return done("Expected error but didn't get one");
		});
	});
});
