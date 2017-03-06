var _ = require("lodash");
var logger = require("./logging").logger("hyperpotamus.normalize");
var verror = require("verror");

// The goal of normalization is to conform the input format (which can be quite flexible)
// to a standard format so the rest of the application has a more limited set of possible
// inputs. This includes expanding items, adding default values, converting single elements to
// arrays, etc.

module.exports = function (script, plugins) {
	var normalizingPlugins = plugins.getNormalizingActionPlugins();

	// Check type of script
	if (_.isNil(script)) {
		throw new verror.VError({
			name: "InvalidScriptError"
		}, "Script is null or undefined.");
	}
	else if (_.isString(script)) { // If a step is just a string, it's the url of a request for a single step script
		logger.trace("The script to be processed is a string, so assuming that the string is the url for a single request");
		script = { steps: { request: { url: script } } };
	}
	else if (_.isArray(script)) { // If script is an array, then assume it is the list of steps
		logger.trace("The script was an array, so assuming that the array is the steps for the script");
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
			logger.trace("The script was an object but did not have a .steps property, so assuming the script is a single step");
			script = { steps: script };
		}

		logger.trace("Normalizing plugins - " + _.map(normalizingPlugins, "name").join(","));
		script.steps = flattenSteps(script);
		script.steps = _.map(script.steps, _.partial(normalizeAction, _, "$.steps", _));
		script.normalized = true;
	}
	return script;

	function flattenSteps(step) {
		if (_.has(step, "steps")) {
			return _.flatMap(_.castArray(step.steps), flattenSteps);
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
					info: _.defaults(verror.info(err), { 
						action, 
						path
					})
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
