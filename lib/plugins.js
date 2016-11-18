var _ = require("lodash");
var path = require("path");
var fs = require("fs");
var logger = require("./logging");

// plugin loading functions
var default_plugin_folder = path.join(__dirname, "plugins");
var default_plugins = validate_plugins(load_plugins(default_plugin_folder));

module.exports = Plugins;

function Plugins() {
	this.plugins = default_plugins;
}

Plugins.prototype.load = function load(plugins_to_load) {
	_.forEach(_.castArray(plugins_to_load), function (plugin) {
		if (_.isString(plugin)) { // String is the folder, file, or require-name to read from
			Object.assign(this.plugins, validate_plugins(load_plugins(plugin)));
		}
		else if (_.isObject(plugin)) { // The plugin is an actual plugin object
			Object.assign(this.plugins, validate_plugins(plugin));
		}
		else {
			throw new Error("Plugin property must either be a path string or plugin object");
		}
	});
};

Plugins.prototype.findPlugin = function findPlugin(properties) {
	return _.keys(_.pick(this.plugins, properties));
}

function load_plugins(path_to_search) {
	// Test to see if this is a path that exists
	if(fs.existsSync(path_to_search)) {
		var stat = fs.statSync(path_to_search);
		// Is it a directory? If so, load each javascript file.
		if(stat.isDirectory()) {
			return _.chain(fs.readdirSync(path_to_search))
				.filter(is_javascript)
				.map(load_plugin)
				.keyBy("name")
				.value();
		}
		
		// Is it a file?
		else if(stat.isFile() && is_javascript(path_to_search)) {
				var plugin = load_plugin(path_to_search);
				var result = {};
				result[plugin.name] = plugin;
				return result;
		}
		else { 
			throw new Error("Cannot load plugin from non-javascript file: " + path_to_search);
		}
	}
	// Maybe it's a require-name
	try {
		var plugin = require(path_to_search);
		plugin.name = _.defaultTo(plugin.name, path_to_search);
	}
	catch(err) {
		throw new Error("Error loading plugin - " + path_to_search, err);
	}

	function is_javascript(filename) {
		return path.extname(filename) == ".js";
	}

	function load_plugin(include) {
		var plugin = require(path.join(path_to_search, include));
		plugin.name = _.defaultTo(plugin.name, path.basename(include, ".js"));
		plugin.logger = logger.logger("plugin." + plugin.name);
		return plugin;
	}
}

function validate_plugins(plugins) {
	// TODO - Add validation to ensure it is a valid plugin
	return plugins;
}

