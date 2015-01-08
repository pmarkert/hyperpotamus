var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.name = "function";

module.exports.handles = function(validation) {
	return _.isFunction(validation);
}

module.exports.process = function(context, callback) {
	context.validation(context, function(err) {
		if(err) return callback(err, context.response, "Custom function");
		return callback();
	});
}
