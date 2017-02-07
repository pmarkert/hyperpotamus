var hyperpotamus = require("../lib");
var fs = require("fs");
var path = require("path");
var _ = require("lodash");
var logging = require("../lib/logging");
var Promise = require("bluebird");
var yaml = require("../lib/yaml");

logging.set_level(process.env.LOG_LEVEL || logging.levels.none);

var server;

function run_scripts(dir, extension, data, should_expect_failure) {
	return Promise.all(fs.readdirSync(path.join(__dirname, dir))
		.filter(filename => path.extname(filename) === extension)
		.map(filename => it(path.join(dir, filename), function () {
			return new hyperpotamus.Processor({ safe: false, auto_load_plugins: true })
				.processFile(path.join(__dirname, dir, filename), _.clone(data))
				.then(() => {
					if (should_expect_failure) {
						throw new Error("Should have raised an error, but didn't");
					}
				}).catch(err => {
					if (!should_expect_failure) {
						// eslint-disable-next-line no-console
						console.log(yaml.dump(err));
						throw err;
					}
				});
		}))
	);
}

describe("HTTP Tests", function () {
	before(function (done) {
		new hyperpotamus.Processor({ safe: false, auto_load_plugins: true }); // Force load all plugins to prevent the first unit test from getting penalized time-wise
		server = require("./httpsite").listen(3000, done);
	});
	after(function () {
		server.close();
	});
	describe("YAML file tests", function () {
		return run_scripts("scripts", ".yml", {}, false);
	});
	describe("Logical tests", function () {
		return run_scripts("logical", ".yml", {}, false);
	});
	describe("YAML file tests with data", function () {
		return run_scripts("data_scripts", ".yml", { data: "asdf", one: "1", two: "2" }, false);
	});
	describe("YAML file tests that should fail", function () {
		return run_scripts("failure_scripts", ".yml", { data: "asdf", one: "1", two: "2" }, true);
	});
});
