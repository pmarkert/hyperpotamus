var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.name = "function";

module.exports.normalize = function(action) {
	if(_.isFunction(action)) {
		return { custom_function: action };
	}
}

module.exports.handles = function(action) {
	return _.isFunction(action.custom_function);
}

module.exports.process = function(action, context, callback) {
	action.custom_function(context, function(err) {
		if(err) return callback(err, context.response, "Custom function");
		return callback();
	});
}
