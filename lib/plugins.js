var _ = require("lodash");
var path = require("path");
var fs = require("fs");
var logger = require("./logging");

// plugin loading functions
var default_plugin_folder = path.join(__dirname, "plugins");
var default_plugins = validate_plugins(load_plugins(default_plugin_folder));
var reserved_properties = ["on_success", "on_failure", "debugger", "plugin"];

module.exports = Plugins;

function Plugins() {
	this.plugins = default_plugins;
}

Plugins.prototype.load = function load(plugins_to_load, base_path) {
	var self = this;
	_.forEach(_.castArray(plugins_to_load), function (plugin) {
		if (_.isString(plugin)) { // String is the folder to read from
			_.assign(self.plugins, load_plugins(plugin, base_path));
		}
		else if (_.isObject(plugin)) { // The plugin is either an actual plugin object or a container
			if (!_.isNil(plugin.plugins)) { // Check for container
				_.assign(self.plugins, plugin.plugins);
			}
			else {
				if (!is_plugin(plugin)) {
					throw new Error("Plugin object must either be a plugin module or plugin container");
				}
				else if (_.isNil(plugin.name)) {
					throw new Error("Plugin module must specify a name");
				}
				else {
					plugin.logger = logger.logger("plugin." + plugin.name);
					self.plugins[plugin.name] = plugin;
				}
			}
		}
		else {
			throw new Error("Plugin property must be either a path string, a require-name, a plugin object, or a plugin container");
		}
	});
};

Plugins.prototype.findPluginForAction = function findPlugin(action) {
	// Each action must have a single property (other than on_success/on_failure which corresponds to the plugin name)
	// Find all plugins that match any non-reserved property names
	var candidate_properties = _.difference(_.keys(action), reserved_properties);
	var matching_plugin_names = _.keys(_.pick(this.plugins, candidate_properties));

	if (matching_plugin_names.length == 0) {
		throw { message: "No plugins available to process action - " + JSON.stringify(action), action: action };
	}
	if (matching_plugin_names.length > 1) {
		throw { message: "Multiple plugins available to process action - " + JSON.stringify(action) + ", Plugins: " + matching_plugin_names.join(","), action: action, matching_plugin_names: matching_plugin_names };
	}
	return this.plugins[matching_plugin_names[0]];
}

Plugins.prototype.getNormalizingPlugins = function getNormalizingPlugins() {
	return _.filter(this.plugins, function (plugin) {
		return _.isFunction(plugin.normalize);
	});
}

function load_plugins(path_to_search, base_path) {
	// Test to see if this is a path that exists
	var plugin_path = path_to_search;
	if (!fs.existsSync(plugin_path)) {
		plugin_path = path.resolve(base_path, path_to_search);
		if (!fs.existsSync(plugin_path)) {
			// Load as a require-name
			return wrap_plugin(init_plugin(load_plugin(path_to_search)), path_to_search); // Will resolve to plugin_path
		}
	}
	var stat = fs.statSync(plugin_path);
	// Is it a directory? If so, load each javascript file.
	if (stat.isDirectory()) {
		var result = _.chain(fs.readdirSync(plugin_path))
			.filter(is_javascript)
			.map(function(p) { return path.resolve(plugin_path, path.basename(p, ".js")); })
			.map(load_plugin)
			.filter(is_plugin)
			.map(init_plugin)
			.keyBy("name")
			.value();
		return result;
	}
	// Is it a file?
	else if (is_javascript(plugin_path)) {
		return wrap_plugin(init_plugin(load_plugin(path.resolve(process.cwd(), plugin_path))));
	}
	else {
		throw new Error("Cannot load plugin from non-javascript file: " + plugin_path);
	}
}

function load_plugin(plugin_path) {
	var plugin = require(plugin_path);
	plugin.name = _.defaultTo(plugin.name, path.basename(plugin_path, ".js"));
	return plugin;
}

function init_plugin(plugin) {
	plugin.logger = logger.logger("plugin." + plugin.name);
	return plugin;
}

function wrap_plugin(plugin) {
	var result = {};
	result[plugin.name] = plugin;
	return result;
}

function is_javascript(filename) {
	return path.extname(filename) == ".js";
}

function is_plugin(plugin) {
	return _.isFunction(plugin.process);
}

function validate_plugins(plugins) {
	// TODO - Add validation to ensure it is a valid plugin
	return plugins;
}

