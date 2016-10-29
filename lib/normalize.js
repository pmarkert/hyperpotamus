var _ = require("underscore");
var logger = require("./logging").logger("hyperpotamus.normalize");
var semver = require("semver");

// The goal of normalization is to conform the input format (which can be quite flexible)
// to a standard format so the rest of the application has a more limited set of possible
// inputs. This includes expanding items, adding default values, converting single elements to
// arrays, etc.

module.exports = function(script, plugins) {

	var normalizing_plugins = _.filter(plugins, function(plugin) { return _.isFunction(plugin.normalize); });
	logger.trace("Normalizing plugins - " + _.pluck(normalizing_plugins, "name").join(","));

	// Check type of script
	if(_.isNull(script) || _.isUndefined(script)) {
		throw { message: "Script cannot be null or undefined" };
	}
	else if(_.isString(script)) { // If a step is just a string, it's the url of a request for a single step script
		logger.trace("SHORTCUT: The script to be processed is a string, so assuming that the string is the url for a single request");
		script = { steps : { request : { url : script } } } 
	}
	else if(_.isArray(script)) { // If script is an array, then assume it is the list of steps
		logger.trace("SHORTCUT: The script was an array, so assuming that the array is the steps for the script");
		script = { steps : script };;
	}
	else if(!_.isObject(script)) {
		throw { message : "Invalid script: unexpected type.", script : script };
	}

	// Short-circuit if this script has already been normalized
	if(script.normalized) {
		logger.trace("The script has already been marked as normalized, so skipping normalization process.");
	}
	else {
		if(!_.has(script, "steps")) { // Check to see if it is the wrapper (w/steps)
			logger.trace("SHORTCUT: The script was an object but did not have a .steps property, so assuming the script is a single step");
			script = { steps: script };
		}

		// Check for version specifier
		if(script.version) {
			var version = require("../package.json").version;
			if(!semver.satisfies(version, script.version)) {
				throw { message : "Script requires hyperpotamus version: " + script.version + ", current version " + version + " does not meet this requirement." };
			}
		}

		if(!_.isArray(script.steps)) {
			script.steps = [ script.steps ];
		}
		script.steps = _.map(script.steps, normalize_step);

		script.normalized = true;
	}
	return script;

	function normalize_step(step) {
		if(_.isArray(step)) {
			step = { actions: step };
		}
		else if(!_.has(step, "actions")) {
			if(_.has(step, "name")) {
				logger.trace("SHORTCUT: Step has no .actions property, but has a name so map it to a single action");
				var name = step.name;
				delete(step.name);
				step = { name : name, actions: [ step ] };
			}
			else {
				step = { actions: [ step ] };
			}
		}
		try {
			step.actions = normalize_actions(step.actions);
		}
		catch(err) {
			err.step = step;
			throw err;
		}
		return step;
	}

	function normalize_actions(actions) {
		if(!_.isArray(actions)) {
			logger.trace("SHORTCUT: .actions was not an array, so coercing it to an array of one action");
			actions = [ actions ];
		}

		// And now normalize response actions
		return _.map(actions, normalize_action);
	}

	function normalize_action(action) {
		for(var j=0; j<normalizing_plugins.length; j++) {
			try {
				var result = normalizing_plugins[j].normalize(action, normalize_action);
				if(result) {
					action = result;
				}
			}
			catch(err) {
				err.action = action;
				throw err;
			}
		}
		if(action.on_failure) {
			if(_.isString(action.on_failure)) {
				action.on_failure = { goto : action.on_failure };
			}
			action.on_failure = normalize_actions(action.on_failure);
		}
		if(action.on_success) {
			if(_.isString(action.on_success)) {
				action.on_success = { goto : action.on_success };
			}
			action.on_success = normalize_actions(action.on_success);
		}
		return action;
	}
}
