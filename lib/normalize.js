var _ = require("underscore");

// The goal of normalization is to conform the input format (which can be quite flexible)
// to a standard format so the rest of the application has a more limited set of possible
// inputs. This includes expanding items, adding defaults, converting single elements to
// arrays, etc.

module.exports = function(script, plugins) {
	if(_.isString(script)) { // If a step is just a string, it's the url of a request for a single step script
		script = [ { request : { url : script } } ];
	}
	else if(_.isNull(script) || !_.isObject(script)) {
		throw new Error("Invalid script object: must be an array or object.");
	}

	// Short-circuit if this script has already been normalized
	if(_.isObject(script) && script.normalized) {
		return script;
	}

	var normalizing_plugins = _.filter(plugins, function(plugin) { return _.isFunction(plugin.normalize); });

	var normalized = { 
		normalized : true, 
		defaults : {} 
	};
	if(_.isArray(script)) { // If script is an array, then assume it is the list of steps
		normalized.steps = script;
	}
	else {
		if(script.steps) { // Check to see if it is a wrapper (having .steps)
			if(script.defaults) { 
				normalized.defaults = script.defaults;
			}
			normalized.steps = script.steps;
		}
		else { // Script must have been a single step
			normalized.steps = [ script ];
		}
	}
	normalized.steps = _.map( _.filter( normalized.steps, function(step) { return step!=null && step!=="" }), normalize_step);
	return normalized;

	function normalize_step(step) {
		if(!_.has(step, "request") && !_.has(step, "response") && !_.has(step, "actions")) { // If step has no .request,.response, or .actions then the step *is* the request
			step = { request : step };
		}
		if(_.has(step, "response") && _.has(step, "actions")) {
			throw new Error("Step cannot have both response and actions properties");
		}
		if(step.response)  { // Alias .actions to .response
			step.actions = step.response;
			delete(step.response);
		}

		step.request = normalize_request(step.request);
		step.actions = normalize_actions(step.actions);
		return step;
	}

	function normalize_request(request) {
		if(_.isNull(request) || _.isUndefined(request)) {
			request = { url : null };
		}
		if(_.isString(request)) // If request is a string, then it is the url
			request = { url : request };
		if(!request.headers)
			request.headers = {};
		return request;
	}

	function normalize_actions(actions) {
		if(!actions)  {
			actions = [ { status : 200 } ];
		}
		else if(_.isArray(actions)) {
			// Already an array, don't have to do anything
		}
		else {
			actions = [ actions ];
		}

		// And now normalize response actions
		return _.map(actions, normalize_action);
	}

	function normalize_action(action) {
		for(var j=0; j<normalizing_plugins.length; j++) {
			var result = normalizing_plugins[j].normalize(action, normalize_action);
			if(result) action = result;
		}
		return action;
	}
}
