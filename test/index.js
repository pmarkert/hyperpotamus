var hyperpotamus = require("../lib/index");
var async = require("async");
var fs = require("fs");
var path = require("path");
var _ = require("underscore");
var logging = require("../lib/logging");

logging.set_level(process.env.LOG_LEVEL || logging.levels.none);

function run_scripts(dir, extension, process, data, options, done) {
	var options_done = options.done;
	async.each(fs.readdirSync(path.join(__dirname, dir)), function(filename) {
		if(path.extname(filename)===extension) {
			it(path.join(dir, filename), function(done) {
				options.done = options_done ? options_done(done) : done;
				
				process(path.join(__dirname, dir, filename), _.clone(data), options);
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
	hyperpotamus.processor({ safe : false }); // Force load all handler.js to prevent the first unit test from getting penalized time-wise
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
		run_scripts("scripts", ".yml", hyperpotamus.yaml.process_file, data, { safe : false }, done);
	});
	describe("Logical tests", function(done) {
		var data = {};
		run_scripts("logical", ".yml", hyperpotamus.yaml.process_file, data, { safe : false }, done);
	});
	describe("YAML file tests with data", function(done) {
		var data = { data : "asdf", one : "1", two : "2" }
		run_scripts("data_scripts", ".yml", hyperpotamus.yaml.process_file, data, { safe : false }, done);
	});
	describe("YAML file tests that should fail", function(done) {
		var data = { data : "asdf", one : "1", two : "2" }
		run_scripts("failure_scripts", ".yml", hyperpotamus.yaml.process_file, data, { safe : false, done : expect_failure }, done);
	});
});
