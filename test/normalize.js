var normalize = require("../lib/normalize");
var load = require("../lib/load")({ safe : false });
var async = require("async");
var fs = require("fs");
var path = require("path");
var chai = require("chai");
chai.config.showDiff = true;
var should = chai.should();
var _ = require("underscore");
var useragent = require("../lib/useragent");

describe("Normalize", function(done) {
	run_normal_tests("scripts", done);
});

describe("Normalize logical", function(done) {
	run_normal_tests("logical", done);
});

function run_normal_tests(dir, done) {
	async.each(fs.readdirSync(path.join(__dirname, dir)), function(filename) {
		if(path.extname(filename)===".normal") {
			var compare = path.basename(filename, ".normal");
			it(path.join(dir, compare), function(done) {
				var to_normalize = load.scripts.yaml.file(path.join(__dirname, dir, compare));
				var expected = load.scripts.yaml.file(path.join(__dirname, dir, filename));
				fix_useragent(expected);
				var normalized = normalize(to_normalize, load.plugins);
				normalized.should.deep.equal(expected, JSON.stringify(normalized));
				done();
			});
		};
	}, done); 
}

function fix_useragent(script) {
	for(var i=0;i<script.steps.length;i++) {
		if(script.steps[i].request && script.steps[i].request.headers && script.steps[i].request.headers["user-agent"]==="hyperpotamus") {
			script.steps[i].request.headers["user-agent"] = useragent;
		}
	}
}
