var _ = require("lodash");
var path = require("path");
var fs = require("fs");
var logging = require("./logging");
var logger = logging.logger("hyperpotamus.plugins");
var verror = require("verror");

var reservedProperties = ["on_success", "on_failure", "debugger", "plugin", "path"];

var defaultActionPluginsDir = path.join(__dirname, "actions");
var defaultActionPlugins = {};

var corePlugin = {
	hyperpotamus: {
		actions: _(fs.readdirSync(defaultActionPluginsDir))
			.filter(p => path.extname(p) === ".js")
			.map(p => path.basename(p, ".js"))
			.map(f => [f, require(path.join(defaultActionPluginsDir, f))])
			.fromPairs()
			.value()
	}
};
_loadPlugin(corePlugin, defaultActionPlugins);

module.exports = Plugins;

function Plugins() {
	this.actionPlugins = defaultActionPlugins;
}

Plugins.prototype.loadPlugins = function load(plugin) {
	if (_.isArray(plugin)) {
		plugin.each(this.loadPlugins);
	}
	else if (_.isString(plugin)) { // String is the folder to read from
		var resolvedPath = path.resolve(plugin);
		if(!fs.existsSync(resolvedPath)) {
			logger.info(`Skipping non-existing plugin path - ${resolvedPath}`);
		}
		else {
			var candidateModules = loadModulesFromPath(resolvedPath);
			if (!candidateModules.reduce((loadedPluginCount, module) => loadedPluginCount + _loadPlugin(module, this.actionPlugins), 0)) {
				logger.warn(`No plugins found in path - ${resolvedPath}`);
			}
		}
	}
	else if (_.isObject(plugin)) { // Load plugin directly from an instance
		if (!_loadPlugin(plugin, this.actionPlugins)) {
			throw new verror.VError({
				name: "InvalidPluginError"
			}, "Plugin object is not a valid plugin module");
		}
	}
};

Plugins.prototype.findPluginForAction = function findPluginForAction(action) {
	// Each action must have a single property (other than on_success/on_failure which corresponds to the plugin name)
	// Find all plugins that match any non-reserved property names
	var candidate_properties = _.difference(_.keys(action), reservedProperties);
	var matching_plugin_names = _.keys(_.pick(this.actionPlugins, candidate_properties));

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
	return this.actionPlugins[matching_plugin_names[0]];
};

Plugins.prototype.getNormalizingActionPlugins = function getNormalizingActionPlugins() {
	return _.filter(this.actionPlugins, function (plugin) {
		return _.isFunction(plugin.normalize);
	});
};

function _loadPlugin(plugin, master_plugins) {
	var result = 0;
	if (isValidPlugin(plugin)) {
		result++;
		if (_.has(plugin.hyperpotamus, "actions")) {
			_.each(plugin.hyperpotamus.actions, (action, name) => {
				action.logger = logging.logger("action." + name);
				action.name = name;
				master_plugins[name] = action;
			});
		}
	}
	return result;
}

function loadModulesFromPath(pathToSearch) {
	try {
		// Attempt to loadPlugins the target path as a module 
		return [require(pathToSearch)];
	}
	catch (err) {
		if (err.code === "MODULE_NOT_FOUND") {
			// Only if Module not found.
			// If we couldn't loadPlugins from the targetPath, look in all immediate subdirectories
			try {
				return _(fs.readdirSync(pathToSearch))
					.map(f => path.join(pathToSearch, f))
					.filter(f => fs.statSync(f).isDirectory())
					.map(f => {
						var module_path = path.resolve(pathToSearch, f);
						try {
							return require(module_path);
						}
						catch (err) {
							throw new verror.VError({
								name: "InvalidPluginModule",
								cause: err,
								info: {
									path: module_path
								}
							}, "Error loading module - %s", module_path);
						}
					})
					.value();
			}
			catch (innerErr) {
				throw new verror.VError({
					name: "InvalidPluginPath",
					path: pathToSearch,
					cause: innerErr
				}, "Failed to load modules from path - %s", pathToSearch);
			}
		}
		else {
			throw err;
		}
	}
}

function isValidPlugin(candidate) {
	return _.has(candidate, "hyperpotamus");
}
