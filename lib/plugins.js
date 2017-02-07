var _ = require("lodash");
var path = require("path");
var fs = require("fs");
var logger = require("./logging");
var verror = require("verror");

// plugin loading functions
var defaultPluginFolder = path.join(__dirname, "plugins");
var defaultPlugins = validatePlugins(loadPlugins(defaultPluginFolder));
var reservedProperties = ["on_success", "on_failure", "debugger", "plugin", "path"];

module.exports = Plugins;

function Plugins() {
	this.plugins = defaultPlugins;
}

Plugins.prototype.load = function load(pluginsToLoad, basePath) {
	var self = this;
	_.forEach(_.castArray(pluginsToLoad), function (plugin) {
		if (_.isString(plugin)) { // String is the folder to read from
			_.assign(self.plugins, loadPlugins(plugin, basePath));
		}
		else if (_.isObject(plugin)) { // The plugin is either an actual plugin object or a container
			if (!_.isNil(plugin.plugins)) { // Check for container
				_.assign(self.plugins, plugin.plugins);
			}
			else {
				if (!isPlugin(plugin)) {
					throw new verror.VError({
						name: "InvalidPluginError"
					}, "Plugin object must either be a plugin module or plugin container");
				}
				else if (_.isNil(plugin.name)) {
					throw new verror.VError({
						name: "PluginNameRequired"
					}, "Plugin module must specify a name");
				}
				else {
					plugin.logger = logger.logger("plugin." + plugin.name);
					self.plugins[plugin.name] = plugin;
				}
			}
		}
		else {
			throw new verror.VError({
				name: "InvalidPluginPath"
			}, "Plugin property must be either a path string, a require-name, a plugin object, or a plugin container");
		}
	});
};

Plugins.prototype.findPluginForAction = function findPlugin(action) {
	// Each action must have a single property (other than on_success/on_failure which corresponds to the plugin name)
	// Find all plugins that match any non-reserved property names
	var candidate_properties = _.difference(_.keys(action), reservedProperties);
	var matching_plugin_names = _.keys(_.pick(this.plugins, candidate_properties));

	if (matching_plugin_names.length == 0) {
		throw new verror.VError({
			name: "NoMatchingPluginsError",
			info: {
				candidate_properties,
				action
			}
		}, "No Plugins found to process action");
	}
	if (matching_plugin_names.length > 1) {
		throw new verror.VError({
			name: "MultipleMatchingPluginsError",
			info: {
				candidate_properties,
				action,
				matching_plugin_names
			}
		}, "Multiple plugins found to process action");
	}
	return this.plugins[matching_plugin_names[0]];
};

Plugins.prototype.getNormalizingPlugins = function getNormalizingPlugins() {
	return _.filter(this.plugins, function (plugin) {
		return _.isFunction(plugin.normalize);
	});
};

function loadPlugins(pathToSearch, basePath) {
	// Test to see if this is a path that exists
	var pluginPath = pathToSearch;
	if (!fs.existsSync(pluginPath)) {
		pluginPath = path.resolve(basePath, pathToSearch);
		if (!fs.existsSync(pluginPath)) {
			// Load as a require-name
			return wrapPlugin(initPlugin(loadPlugin(pathToSearch)), pathToSearch); // Will resolve to pluginPath
		}
	}
	var stat = fs.statSync(pluginPath);
	// Is it a directory? If so, load each javascript file.
	if (stat.isDirectory()) {
		var result = _.chain(fs.readdirSync(pluginPath))
			.filter(isJavascript)
			.map(function (p) {
				return path.resolve(pluginPath, path.basename(p, ".js"));
			})
			.map(loadPlugin)
			.filter(isPlugin)
			.map(initPlugin)
			.keyBy("name")
			.value();
		return result;
	}
	// Is it a file?
	else if (isJavascript(pluginPath)) {
		return wrapPlugin(initPlugin(loadPlugin(path.resolve(process.cwd(), pluginPath))));
	}
	else {
		throw new verror.VError({
			name: "InvalidPluginError"
		}, "Cannot load plugin from non-javascript file: %s", pluginPath);
	}
}

function loadPlugin(pluginPath) {
	var plugin = require(pluginPath);
	plugin.name = _.defaultTo(plugin.name, path.basename(pluginPath, ".js"));
	return plugin;
}

function initPlugin(plugin) {
	plugin.logger = logger.logger("plugin." + plugin.name);
	return plugin;
}

function wrapPlugin(plugin) {
	var result = {};
	result[plugin.name] = plugin;
	return result;
}

function isJavascript(filename) {
	return path.extname(filename) == ".js";
}

function isPlugin(plugin) {
	return _.isFunction(plugin.process);
}

function validatePlugins(plugins) {
	// TODO - Add validation to ensure it is a valid plugin
	return plugins;
}

