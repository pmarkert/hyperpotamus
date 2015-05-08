var _ = require("underscore");
var logger = require("../logging").logger("hyperpotamus.plugins.custom_function");

module.exports.name = "function";

module.exports.safe = false;

module.exports.normalize = function(action) {
	if(_.isObject(action.requires)) {
		for(var key in action.requires) {
			action.requires[key] = require(action.requires[key]);
		}
	}
}

module.exports.handles = function(action) {
	return _.isFunction(action.custom_function);
}

module.exports.process = function(context, callback) {
	logger.warn("custom_function has been deprecated. Use function instead.");
	if(this.debugger) debugger;
	logger.debug("About to invoke custom function");
	this.custom_function(context, function(err) {
		if(err) return callback(err, context.response, "Custom function");
		return callback();
	}, this.requires);
}
