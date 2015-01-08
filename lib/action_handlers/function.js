var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.name = "function";

module.exports.handles = function(action) {
	return _.isFunction(action);
}

module.exports.process = function(action, context, callback) {
	action(context, function(err) {
		if(err) return callback(err, context.response, "Custom function");
		return callback();
	});
}
