var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.handles = function(validation) {
	return _.isFunction(validation);
}

module.exports.process = function(context) {
	var local_context = _.clone(context);
	local_context.callback = function(err) {
		if(err) return context.callback(err, context.response, "Custom function");
		return context.callback();
	};
	context.validation(local_context);
}
