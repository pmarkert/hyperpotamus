var _ = require("lodash");
var fs = require("fs");
var yaml = require("js-yaml");
var assert = require("assert");

exports.load = function load(script, allow_unsafe) {
	assert(_.isString(script), "script must be a string");
	// Pre-process script to replace leading tabs with spaces (because YAML doesn't technically allow tab-indentation)
	var script_text = script.replace(/^\t+/gm, function (match) {
		return Array(match.length + 1).join(" ");
	});
	var loader = (allow_unsafe == true) ? yaml.load : yaml.safeLoad;
	return loader(script_text);
};

exports.loadFile = function loadFile(filename, allow_unsafe) {
	return exports.load(fs.readFileSync(filename, "utf-8"), allow_unsafe);
};
