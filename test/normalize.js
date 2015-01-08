var normalize = require("../lib/normalize")();
var load = require("../lib/load");
var async = require("async");
var fs = require("fs");
var path = require("path");
var chai = require("chai");
chai.config.showDiff = true;
var should = chai.should();
var _ = require("underscore");

describe("Normalize", function(done) {
	var dir = "scripts";
	async.each(fs.readdirSync(path.join(__dirname, dir)), function(filename) {
		if(path.extname(filename)===".normal") {
			var compare = path.basename(filename, ".normal");
			it(path.join(dir, compare), function(done) {
				load.yaml.file(path.join(__dirname, dir, compare), function(err, to_normalize) {
					should.not.exist(err, "Failed to load target file " + compare);
					load.yaml.file(path.join(__dirname, dir, filename), function(err, expected) {
						should.not.exist(err, "Failed to load comparison file " + filename);
						var normalized = normalize(to_normalize);
						normalized.should.deep.equal(expected, JSON.stringify(normalized));
						done();
					});
				});
			});
		};
	}, done); 
	
});
