var _ = require("lodash");
var logger = require("./logging").logger("hyperpotamus.normalize");

// The goal of normalization is to conform the input format (which can be quite flexible)
// to a standard format so the rest of the application has a more limited set of possible
// inputs. This includes expanding items, adding default values, converting single elements to
// arrays, etc.

module.exports = function (script, plugins) {
	var normalizing_plugins = plugins.getNormalizingPlugins();
	logger.trace("Normalizing plugins - " + _.map(normalizing_plugins, "name").join(","));

	// Check type of script
	if (_.isNil(script)) {
		throw new error.InvalidScriptError("Script is null or undefined.");
	}
	else if (_.isString(script)) { // If a step is just a string, it's the url of a request for a single step script
		logger.trace("SHORTCUT: The script to be processed is a string, so assuming that the string is the url for a single request");
		script = { steps: { request: { url: script } } }
	}
	else if (_.isArray(script)) { // If script is an array, then assume it is the list of steps
		logger.trace("SHORTCUT: The script was an array, so assuming that the array is the steps for the script");
		script = { steps: script };
	}
	else if (!_.isObject(script)) {
		throw new error.InvalidScriptError("Script is an unexpected type: " + typeof(script));
	}

	// Short-circuit if this script has already been normalized
	if (script.normalized) {
		logger.trace("The script has already been normalized, so skipping normalization process.");
	}
	else {
		if (!_.has(script, "steps")) { // Check to see if it is the wrapper (w/steps)
			logger.trace("SHORTCUT: The script was an object but did not have a .steps property, so assuming the script is a single step");
			script = { steps: script };
		}

		script.steps = normalize_step(script, "$.steps");
		script.normalized = true;
	}
	return script;

	function normalize_step(step, parent_path, index) {
		index = index ? "." + index : "";
		var path = `${parent_path}${index}`;
		if (_.has(step, "steps")) {
			return _.flatMap(_.castArray(step.steps), (s, index) => normalize_step(s, parent_path, index.toString()));
		}
		if (_.isArray(step)) {
			step = { actions: step };
		}
		else if (!_.has(step, "actions")) {
			if (_.has(step, "name")) {
				logger.trace("SHORTCUT: Step has no .actions property, but has a name so map it to a named step with a single action");
				var name = step.name;
				delete(step.name);
				step = { name: name, actions: [step] };
			}
			else {
				step = { actions: [step] };
			}
		}
		step.path = path;
		try {
			step.actions = normalize_action(step.actions, step.path + ".actions");
		}
		catch (err) {
			err.step = step;
			throw err;
		}
		return step;
	}
	
	function normalize_action(action, parent_path, index) {
		index = _.isNil(index) ? "" : "." + index;
		var path = `${parent_path}${index}`;
		var action_normalizer = function(action, sub_index) {
			return normalize_action(action, path, sub_index);
		}
		if (_.isArray(action)) {
			// And now normalize response actions
			return action.map(action_normalizer);
		}
		for (var j = 0; j < normalizing_plugins.length; j++) {
			try {
				var result = normalizing_plugins[j].normalize(action, action_normalizer);
				if (result) {
					action = result;
				}
			}
			catch (err) {
				err.action = action;
				throw err;
			}
		}
		action.path = path;
		if (action.on_failure) {
			if (_.isString(action.on_failure)) {
				action.on_failure = { goto: action.on_failure };
			}
			action.on_failure = action_normalizer(action.on_failure, "on_failure");
		}
		if (action.on_success) {
			if (_.isString(action.on_success)) {
				action.on_success = { goto: action.on_success };
			}
			action.on_success = action_normalizer(action.on_success, "on_success");
		}
		return action;
	}
}
