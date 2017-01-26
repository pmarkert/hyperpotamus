var _ = require("lodash");
var fs = require("fs");
var yaml = require("js-yaml");
var yamlinc = require("yaml-include");
var assert = require("assert");

exports.load = function load(script, safe, filename) {
	assert(_.isString(script), "script must be a string");
	// Pre-process script to replace leading tabs with spaces (because YAML doesn't technically allow tab-indentation)
	var script_text = script.replace(/^\t+/gm, function (match) {
		return Array(match.length + 1).join(" ");
	});
	if (safe) {
		return yaml.safeLoad(script_text);
	}
	else {
		yamlinc.setBaseFile(filename);
		return yaml.load(script_text, { schema: yamlinc.YAML_INCLUDE_SCHEMA, filename: filename || "" });
	}
};

exports.loadFile = function loadFile(filename, safe) {
	return exports.load(fs.readFileSync(filename, "utf-8"), safe, filename);
};

exports.dump = function dump(object) {
	return yaml.dump(object);
};
