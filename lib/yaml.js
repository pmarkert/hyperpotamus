var _ = require("lodash");
var fs = require("fs");
var yaml = require("js-yaml");
var yamlinc = require("yaml-include");
var assert = require("assert");
var path = require("path");

exports.load = function load(script, allow_unsafe, filename) {
	assert(_.isString(script), "script must be a string");
	// Pre-process script to replace leading tabs with spaces (because YAML doesn't technically allow tab-indentation)
	var script_text = script.replace(/^\t+/gm, function (match) {
		return Array(match.length + 1).join(" ");
	});
	if(allow_unsafe) {
		yamlinc.setBaseFile(filename);
		return yaml.load(script_text, { schema: yamlinc.YAML_INCLUDE_SCHEMA, filename: filename });
	}
	else {
		return yaml.safeLoad(script_text);
	}
};

exports.loadFile = function loadFile(filename, allow_unsafe) {
	return exports.load(fs.readFileSync(filename, "utf-8"), allow_unsafe, filename);
};
