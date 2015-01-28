var _ = require("underscore");

module.exports.name = "function";

module.exports.safe = false;

module.exports.normalize = function(action) {
	if(_.isFunction(action)) {
		action = { custom_function: action };
	}
	if(_.isObject(action.requires)) {
		for(var key in action.requires) {
			action.requires[key] = require(action.requires[key]);
		}
	}
}

module.exports.handles = function(action) {
	return _.isFunction(action.custom_function);
}

module.exports.process = function(action, context, callback) {
	action.custom_function(context, function(err) {
		if(err) return callback(err, context.response, "Custom function");
		return callback();
	}, action.requires);
}
