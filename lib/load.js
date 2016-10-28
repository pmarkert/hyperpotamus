var _ = require("underscore");
var fs = require("fs");
var yaml = require("js-yaml");
var assert = require("assert");
var path = require("path");
var logger = require("./logging");

// plugin loading functions
var default_plugin_folder = path.join(__dirname, "plugins");

function is_javascript(filename) {
	return path.extname(filename) == ".js";
}

function load_plugins(path_to_search, safeOnly) {
	var includes = _.filter(fs.readdirSync(path_to_search), is_javascript);
	var result = {};
	for (var i = 0; i < includes.length; i++) {
		var plugin = require(path.join(path_to_search, includes[i]));
		if (!safeOnly || plugin.safe) {
			result[path.basename(includes[i], ".js")] = plugin;
		}
		plugin.name = path.basename(includes[i], ".js");
	}
	return result;
}

function validate_plugins(plugins) {
	// TODO - Add validation to ensure it is a valid plugin
	return plugins;
}

module.exports = function (options) {
	options = options || {};
	var safe_only = _.has(options, "safe") ? options.safe : true; // Default to save mode
	var plugins = validate_plugins(load_plugins(default_plugin_folder, safe_only));
	if (options.plugins) {
		// If single item -> Array
		options.plugins = _.isArray(options.plugins) ? options.plugins : [options.plugins];

		for (var i = 0; i < options.plugins.length; i++) {
			// String is the folder to read from
			if (_.isString(options.plugins[i])) {
				Object.assign(plugins, validate_plugins(load_plugins(options.plugins[i], safe_only)));
			}
			else if (_.isObject(options.plugins[i])) {
				Object.assign(plugins, validate_plugins(options.plugins[i]));
			}
			else {
				throw new Error("Plugin property must either be a path string or plugin object");
			}
		}
	}
	var plugin_keys = _.keys(plugins);
	for (var i = 0; i < plugin_keys.length; i++) {
		plugins[plugin_keys[i]].logger = logger.logger("plugin." + plugin_keys[i]);
	}
	return {
		scripts: {
			yaml: {
				text: function (script_text) {
					assert(_.isString(script_text), "script_text must be a string");
					assert(script_text, "script_text is blank");
					// Pre-process script to replace leading tabs with spaces (because YAML doesn't technically allow tab-indentation)
					script_text = script_text.replace(/^\t+/gm, function (match) {
						var result = " ";
						for (var i = 1; i < match.length; i++) {
							result += " ";
						}
						return result;
					});
					var loader = safe_only ? yaml.safeLoad : yaml.load;
					return loader(script_text);
				},
				file: function (filename) {
					var script_text = fs.readFileSync(filename, "utf-8");
					return this.text(script_text, safe_only);
				}
			}
		},
		plugins: plugins
	}
}
