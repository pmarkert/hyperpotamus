var _ = require("underscore");
var fs = require("fs");
var yaml = require("js-yaml");
var assert = require("assert");

function yaml_text(script_text) {
	assert(_.isString(script_text), "script_text must be a string");
	assert(script_text, "script_text is blank");
	return yaml.safeLoad(script_text); // TODO - options for unsafe loading
}

function yaml_unsafe_text(script_text) {
	assert(_.isString(script_text), "script_text must be a string");
	assert(script_text, "script_text is blank");
	return yaml.safeLoad(script_text, { schema : DEFAULT_FULL_SCHEMA }); // TODO - options for unsafe loading
}

function load_file(filename, transform, callback) {
	fs.readFile(filename, "utf-8", function(err, script_text) { 
		if(err) return callback(err); 
		callback(null, transform(script_text));
	});
}

module.exports = {
	yaml: {
		text : yaml_text,
		file : function(filename, callback) {
			load_file(filename, yaml_text, callback);
		}
	},
	unsafe_yaml: {
		text : yaml_unsafe_text,
		file : function(filename, callback) {
			load_file(filename, yaml_unsafe_text, callback);
		}
	}
}
