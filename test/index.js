var hyperpotamus = require("../lib/index");
var async = require("async");
var fs = require("fs");
var path = require("path");

function process_file(filename) {
}

// Startup http server for echo testing
var server = require("./httpsite");
server.listen(3000, function(err) {
	describe("YAML file tests", function(done) {
		async.each(fs.readdirSync(path.join(__dirname,"scripts")), function(filename) {
			if(path.extname(filename)===".yml") {
				it(path.join("scripts",filename), function(done) {
					hyperpotamus.process_file(path.join(__dirname,"scripts",filename), done);
				});
			}
		}, function(err) {
			server.stop();
			done(err);
		});
	});
	describe("YAML file tests with data", function(done) {
		async.each(fs.readdirSync(path.join(__dirname,"data_scripts")), function(filename) {
			if(path.extname(filename)===".yml") {
				it(path.join("data_scripts",filename), function(done) {
					hyperpotamus.process_file(path.join(__dirname,"data_scripts",filename), { data : "asdf", one : "1", two : "2" }, done);
				});
			}
		}, function(err) {
			server.stop();
			done(err);
		});
	});
});
