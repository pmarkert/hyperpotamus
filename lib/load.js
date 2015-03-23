var _ = require("underscore");
var fs = require("fs");
var yaml = require("js-yaml");
var assert = require("assert");
var path = require("path");

// Script loading functions
function yaml_text(script_text, safe_only) {
	assert(_.isString(script_text), "script_text must be a string");
	assert(script_text, "script_text is blank");
	// Pre-process script to replace leading tabs with spaces (because YAML doesn't technically allow tab-indentation)
        script_text = script_text.replace(/^\t+/gm, function(match) { var result = " "; for(var i=1;i<match.length;i++) result += " "; return result; });
	if(safe_only)
		return yaml.safeLoad(script_text); // TODO - options for unsafe loading
	else
		return yaml.load(script_text);
}

function yaml_file(filename, safe_only) {
	var script_text = fs.readFileSync(filename, "utf-8");
	return yaml_text(script_text, safe_only);
}

// plugin loading functions
var default_plugin_folder = path.join(__dirname, "plugins");

function readJsFiles(folder, safe_only) {
	folder = path.resolve(folder);
	if(!fs.existsSync(folder)) throw new Error("Folder does not exist - " + folder);
	var files = fs.readdirSync(folder);
	var jsfiles = _.filter(files, function(file) { return path.extname(file)===".js"; });
	var plugins = _.map(jsfiles, function(file) { return require(path.join(folder, file)); } );
	if(safe_only) { 
		plugins = _.filter(plugins, function(plugin) { return !!plugin.safe; });
	}
	return plugins;
}

function default_plugins(safe) {
	return readJsFiles(default_plugin_folder, safe);
}

function plugins_from_folder(folder, safe) {
	return readJsFiles(folder, safe);
}

module.exports = function(options) {
	options = options || { safe : true };
	options.safe = _.has(options, "safe") ? options.safe : true;
	plugins = default_plugins(options.safe);
	if(options.plugins) {
		options.plugins = _.isArray(options.plugins) ? options.plugins : [ options.plugins ];
		for(var i=0; i<options.plugins.length; i++) {
			if(_.isString(options.plugins[i])) {
				plugins = _.union(plugins, plugins_from_folder(options.plugins[i], options.safe));
			}
			else if(_.isObject(options.plugins[i]) && _.isFunction(options.plugins[i].handles)) {
				plugins = _.union(plugins, [ options.plugins[i] ] );
			}
		}
	}
	for(var i=0; i<plugins.length; i++) {
		if(plugins[i].connect) {
			plugins[i].connect(this);
		}
	}
	return {
		scripts : {
			yaml: {
				text : function(script_text) { return yaml_text(script_text, options.safe) },
				file : function(script_text) { return yaml_file(script_text, options.safe) }
			},
		},
		plugins: plugins
	}
}
