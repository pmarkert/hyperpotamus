var _ = require("lodash");
var logger = require("./logging").logger("hyperpotamus.normalize");
var verror = require("verror");

// The goal of normalization is to conform the input format (which can be quite flexible)
// to a standard format so the rest of the application has a more limited set of possible
// inputs. This includes expanding items, adding default values, converting single elements to
// arrays, etc.

module.exports = function (script, plugins) {
	var normalizingPlugins = plugins.getNormalizingPlugins();
	logger.trace("Normalizing plugins - " + _.map(normalizingPlugins, "name").join(","));

	// Check type of script
	if (_.isNil(script)) {
		throw new verror.VError({
			name: "InvalidScriptError"
		}, "Script is null or undefined.");
	}
	else if (_.isString(script)) { // If a step is just a string, it's the url of a request for a single step script
		logger.trace("SHORTCUT: The script to be processed is a string, so assuming that the string is the url for a single request");
		script = { steps: { request: { url: script } } };
	}
	else if (_.isArray(script)) { // If script is an array, then assume it is the list of steps
		logger.trace("SHORTCUT: The script was an array, so assuming that the array is the steps for the script");
		script = { steps: script };
	}
	else if (!_.isObject(script)) {
		throw new verror.VError({
			name: "InvalidScriptError"
		}, "Script is an unexpected type: %s", typeof(script));
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

		script.steps = normalizeStep(script, "$.steps");
		script.normalized = true;
	}
	return script;

	function normalizeStep(step, parent_path, index) {
		index = index ? "." + index : "";
		var path = `${parent_path}${index}`;
		if (_.has(step, "steps")) {
			return _.flatMap(_.castArray(step.steps), (s, index) => normalizeStep(s, parent_path, index.toString()));
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
			step.actions = normalizeAction(step.actions, step.path + ".actions");
		}
		catch (err) {
			throw new verror.VError({
				name: "StepNormalizationError",
				cause: err,
				info: { 
					step, 
					path
				}
			}, "step normalization failure");
		}
		return step;
	}

	function normalizeAction(action, parent_path, index) {
		index = _.isNil(index) ? "" : "." + index;
		var path = `${parent_path}${index}`;
		var actionNormalizer = function (action, sub_index) {
			return normalizeAction(action, path, sub_index);
		};
		if (_.isArray(action)) {
			// And now normalize actions
			return action.map(actionNormalizer);
		}
		for (var j = 0; j < normalizingPlugins.length; j++) {
			try {
				var result = normalizingPlugins[j].normalize(action, actionNormalizer, path);
				if (result) {
					action = result;
				}
			}
			catch (err) {
				throw new verror.VError({
					name: "ActionNormalizationError",
					cause: err,
					info: { 
						action, 
						path
					}
				}, "action normalization failure");
			}
		}
		action.path = path;
		if (action.on_failure) {
			if (_.isString(action.on_failure)) {
				action.on_failure = { goto: action.on_failure };
			}
			action.on_failure = actionNormalizer(action.on_failure, "on_failure");
		}
		if (action.on_success) {
			if (_.isString(action.on_success)) {
				action.on_success = { goto: action.on_success };
			}
			action.on_success = actionNormalizer(action.on_success, "on_success");
		}
		return action;
	}
};
