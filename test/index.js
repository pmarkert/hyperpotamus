var hyperpotamus = require("../lib");
var async = require("async");
var fs = require("fs");
var path = require("path");
var _ = require("lodash");
var logging = require("../lib/logging");

logging.set_level(process.env.LOG_LEVEL || logging.levels.none);

var processor, response_defaults;

function run_scripts(dir, extension, data, should_expect_failure, done) {
	async.each(fs.readdirSync(path.join(__dirname, dir)), function(filename) {
		if(path.extname(filename)===extension) {
			it(path.join(dir, filename), function(done) {
				processor.options.response_defaults = response_defaults; // Reset response_defaults
				processor.processFile(path.join(__dirname, dir, filename), _.clone(data), should_expect_failure ? expect_failure(done) : done);
			});
		}
	}, function(err) {
		done(err);
	});
}

function expect_failure(done) {
	return function(err) {
		done(err ? null : new Error("Should have raised an error, but didn't"));
	}
}

before(function() {
	processor = new hyperpotamus.Processor({ safe : false, auto_load_plugins: true }); // Force load all plugins to prevent the first unit test from getting penalized time-wise
	response_defaults = processor.options.response_defaults;
});

describe("HTTP Tests", function() {
	before(function(done) {
		server = require("./httpsite").listen(3000, done);
	});
	after(function() {
		server.close();
	});
	describe("YAML file tests", function(done) {
		var data = {};
		run_scripts("scripts", ".yml", data, false, done);
	});
	describe("Logical tests", function(done) {
		var data = {};
		run_scripts("logical", ".yml", data, false, done);
	});
	describe("YAML file tests with data", function(done) {
		var data = { data : "asdf", one : "1", two : "2" }
		run_scripts("data_scripts", ".yml", data, false, done);
	});
	describe("YAML file tests that should fail", function(done) {
		var data = { data : "asdf", one : "1", two : "2" }
		run_scripts("failure_scripts", ".yml", data, true, done);
	});
});
