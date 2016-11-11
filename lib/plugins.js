var _ = require("lodash");
var path = require("path");
var fs = require("fs");
var logger = require("./logging");

// plugin loading functions
var default_plugin_folder = path.join(__dirname, "plugins");
var default_plugins = validate_plugins(load_plugins(default_plugin_folder));

module.exports = Plugins;

function Plugins() {
	Object.assign(this, default_plugins);
}

Plugins.prototype.load = function load(plugins_to_load) {
	_.forEach(_.castArray(plugins_to_load), function (plugin) {
		if (_.isString(plugin)) { // String is the folder to read from
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

function load_plugins(path_to_search) {
	return _.chain(fs.readdirSync(path_to_search))
		.filter(is_javascript)
		.map(load_plugin)
		.keyBy("name")
		.value();

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

