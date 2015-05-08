var _ = require("underscore");
var logger = require("./logging").logger("hyperpotamus.normalize");

// The goal of normalization is to conform the input format (which can be quite flexible)
// to a standard format so the rest of the application has a more limited set of possible
// inputs. This includes expanding items, adding defaults, converting single elements to
// arrays, etc.

module.exports = function(script, plugins) {

	if(_.isString(script)) { // If a step is just a string, it's the url of a request for a single step script
		logger.trace("SHORTCUT: The script to be processed is a string, so assuming that the string is the url for a single request");
		script = { steps : [ { request : { url : script } } ] };
	}
	else if(_.isNull(script) || !_.isObject(script)) {
		throw { message : "Invalid script object: must be an array or object.", script : script };
	}

	// Short-circuit if this script has already been normalized
	if(_.isObject(script) && script.normalized) {
		logger.trace("The script has already been marked as normalized, so skipping normalization process.");
		return script;
	}

	var normalizing_plugins = _.filter(plugins, function(plugin) { return _.isFunction(plugin.normalize); });
	logger.trace("Number of normalizing plugins - " + normalizing_plugins.length);

	var normalized = { 
		normalized : true, 
		defaults : { 
			request : null, 
			actions : [
				{ status : 200 }
			]
		}
	};

	if(_.isArray(script)) { // If script is an array, then assume it is the list of steps
		logger.trace("SHORTCUT: The script was an array, so assuming that the array are the steps for the script");
		normalized.steps = script;
	}
	else {
		if(script.steps) { // Check to see if it is the wrapper (having .steps)
			if(script.defaults) { 
				normalized.defaults = normalize_step(script.defaults, normalized, true);
			}
			normalized.steps = script.steps;
		}
		else { // Script must have been a single step
			logger.trace("SHORTCUT: The script was an object but did not have a .steps property, so assuming the script is a single step");
			normalized.steps = [ script ];
		}
	}

	normalized.steps = _.map( _.filter(normalized.steps, function(step) { 
		return step!=null && step!=="" }
	), function(step) { 
		return normalize_step(step, normalized, false); 
	});

	return normalized;

	function normalize_step(step, normalized, is_defaults) {
		if(!_.has(step, "request") && !_.has(step, "response") && !_.has(step, "actions")) { 
			logger.trace("SHORTCUT: Step has no .request, .response, or .actions property, so assuming that the step is the request");
			step = { request : step };
		}
		if(_.has(step, "response") && _.has(step, "actions")) {
			throw { message : "Step cannot have both response and actions properties", step : step };
		}
		if(step.response)  { 
			logger.trace("SHORTCUT: .response is an alias for .actions. Renaming property.");
			step.actions = step.response;
			delete(step.response);
		}

		step.request = normalize_request(step.request, step, normalized, is_defaults);
		step.actions = normalize_actions(step.actions, step, normalized, is_defaults);
		return step;
	}

	function normalize_request(request, step, normalized, is_defaults) {
		if(_.isNull(request) || _.isUndefined(request)) {
			logger.trace("Step has a null request, so assuming it is an actions only step.");
			return null;
		}

		if(_.isArray(request))
			throw { message : "Request was not expected to be an array.", step : step };

		if(_.isString(request)) {
			logger.trace("SHORTCUT: Request is a string so assuming it is the .url property.");
			request = { url : request };
		}
		else if(!is_defaults && !_.isString(request.url)) 
			throw { message : "Request must have a .url property that is a string", step : step };

		request = _.defaults(request, normalized.defaults.request);
		if(!request.headers) { request.headers = {}; }
		if(!request.headers["user-agent"]) request.headers["user-agent"] = require("./useragent");
		if(request.socks) {
			if(!request.agentOptions) request.agentOptions = {};
			request.agentOptions = _.defaults(request.agentOptions, request.socks);
			delete(request.socks);
		}
		return request;
	}

	function normalize_actions(actions, step, normalized, is_defaults) {
		if(!actions)  {
			return normalized.defaults.actions;
		}

		if(!_.isArray(actions)) {
			logger.trace("SHORTCUT: .actions was not an array, so coercing it to an array of one action");
			actions = [ actions ];
		}

		// And now normalize response actions
		return _.map(actions, function(action) { 
			return normalize_action(action, step, normalized, is_defaults); 
		});
	}

	function normalize_action(action, step, normalized, is_defaults) {
		for(var j=0; j<normalizing_plugins.length; j++) {
			var result = normalizing_plugins[j].normalize(action, normalize_action);
			if(result) action = result;
		}
		return action;
	}
}
