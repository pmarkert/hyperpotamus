var hyperpotamus = require("../lib/index");
var async = require("async");
var fs = require("fs");
var path = require("path");

// Startup http server for echo testing
var server = require("./httpsite");

function run_scripts(dir, extension, processor, data, done) {
	async.each(fs.readdirSync(path.join(__dirname, dir)), function(filename) {
		if(path.extname(filename)===extension) {
			it(path.join(dir, filename), function(done) {
				processor(path.join(__dirname, dir, filename), data, done);
			});
		}
	}, function(err) {
		server.stop();
		done(err);
	});
}

server.listen(3000, function(err) {
	describe("YAML file tests", function(done) {
		var data = {};
		run_scripts("scripts", ".yml", hyperpotamus.yaml.process_file, data, done);
	});
	describe("YAML file tests with data", function(done) {
		var data = { data : "asdf", one : "1", two : "2" }
		run_scripts("data_scripts", ".yml", hyperpotamus.yaml.process_file, data, done);
	});
});
