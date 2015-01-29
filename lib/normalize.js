var _ = require("underscore");

// The goal of normalization is to conform the input format (which can be quite flexible)
// to a standard format so the rest of the application has a more limited set of possible
// inputs. This includes expanding items, adding defaults, converting single elements to
// arrays, etc.


module.exports = function(script, plugins) {
	if(!plugins) plugins = require("./load").plugins.defaults();
	var normalizing_plugins = _.filter(plugins, function(plugin) { return _.isFunction(plugin.normalize); });

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

	function normalize_action(action) {
		for(var j=0; j<normalizing_plugins.length; j++) {
			var result = normalizing_plugins[j].normalize(action, normalize_action);
			if(result) action = result;
		}
		return action;
	}

	function normalize_response(response) {
		if(!response)  {
			response = { actions : [ { status : 200 } ] };
		}
		if(_.isArray(response)) { // Single action -> array of single action
			response = { actions : response };
		}
		else if(_.isFunction(response) || _.isRegExp(response) || !_.isObject(response)) {
			response = { actions : [ response ] };
		}
		else if(_.isObject(response)) {
			if(!response.actions) {
				if(!response.save) { // response is a single action
					response = { actions: [ response ] };
				}
				else { 
					response.actions = [ { status : 200 } ];
				}
			}
			else {
				if(!_.isArray(response.actions)) {
					response.actions = [ response.actions ];
				}
			}
		}

		// And now normalize response actions
		for(var i=0; i<response.actions.length; i++) {
			// Use each plugin to potentially normalize the action
			response.actions[i] = normalize_action(response.actions[i]);
		}
		return response;
	}

	function normalize_step(step) {
		if(!step) return null;
		if(!_.has(step,"request") && !_.has(step, "response") && !_.has(step, "actions")) // If step has no .request, then the step *is* the request
			step = { request : step };
		if(step.actions && !_.has(step, "response"))  {
			step.response = { actions : step.actions };
			delete(step.actions);
		}

		step.request = normalize_request(step.request);
		step.response = normalize_response(step.response);
		return step;
	}
	if(_.isObject(script) && script.normalized) return script;
	var normalized = _.isArray(script) ? script : [ script ]
	if(!normalized.defaults) { normalized.defaults = {}; }
	return { normalized : true, defaults : normalized.defaults, steps : _.filter(_.map(normalized, normalize_step), function(step) { return step!=null }) }
}
