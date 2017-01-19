var normalize = require("../lib/normalize");
var yaml = require("../lib/yaml");
var Plugins = require("../lib/plugins");
var async = require("async");
var fs = require("fs");
var path = require("path");
var chai = require("chai");
chai.should();
chai.config.showDiff = true;

var plugins = new Plugins();

describe("Normalize", function(done) {
	run_normalization_tests("scripts", done);
});

describe("Normalize logical", function(done) {
	run_normalization_tests("logical", done);
});

function run_normalization_tests(dir, done) {
	if(process.env.OVERWRITE_RESULTS === "true") return overwrite_normalization_results(dir, done);
	async.each(fs.readdirSync(path.join(__dirname, dir)), function(filename) {
		if(path.extname(filename)===".normal") {
			var compare = path.basename(filename, ".normal");
			it(path.join(dir, compare), function(done) {
				var to_normalize = yaml.loadFile(path.join(__dirname, dir, compare));
				var expected = yaml.loadFile(path.join(__dirname, dir, filename));
				var normalized = normalize(to_normalize, plugins);
				normalized.should.deep.equal(expected, JSON.stringify(normalized));
				done();
			});
		}
	}, done); 
}

function overwrite_normalization_results(dir, done) {
	async.each(fs.readdirSync(path.join(__dirname, dir)), function(filename) {
		if(path.extname(filename)===".yml") {
			var to_normalize = yaml.loadFile(path.join(__dirname, dir, filename));
			var normalized = normalize(to_normalize, plugins);
			fs.writeFile(path.join(__dirname, dir, filename + ".normal"), yaml.dump(normalized), done);
		}
	}, done); 
	
}
