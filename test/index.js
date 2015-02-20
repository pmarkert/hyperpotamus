var hyperpotamus = require("../lib/index");
var async = require("async");
var fs = require("fs");
var path = require("path");
var _ = require("underscore");
var logging = require("../lib/logging");

logging.set_level(process.env.LOG_LEVEL || "OFF");

function run_scripts(dir, extension, processor, data, done) {
	async.each(fs.readdirSync(path.join(__dirname, dir)), function(filename) {
		if(path.extname(filename)===extension) {
			it(path.join(dir, filename), function(done) {
				processor(path.join(__dirname, dir, filename), _.clone(data), done);
			});
		}
	}, function(err) {
		done(err);
	});
}

function expect_failure(filename, data, done) {
	hyperpotamus.yaml.process_file(filename, data, function(err) {
		done(err ? null : new Error("Should have raised an error, but didn't"));
	});
}

before(function() {
	hyperpotamus.load(false).plugins.defaults(); // Force load all handler.js to prevent the first unit test from getting penalized time-wise
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
		run_scripts("scripts", ".yml", hyperpotamus.yaml.process_file, data);
	});
	describe("YAML file tests with data", function(done) {
		var data = { data : "asdf", one : "1", two : "2" }
		run_scripts("data_scripts", ".yml", hyperpotamus.yaml.process_file, data, done);
	});
	describe("YAML file tests that should fail", function(done) {
		var data = { data : "asdf", one : "1", two : "2" }
		run_scripts("failure_scripts", ".yml", expect_failure, data, done);
	});
});
