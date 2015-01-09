var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.name = "set";

module.exports.handles = function(action) {
	return _.isObject(action.set);
}

module.exports.process = function(action, context, callback) {
	for(var key in action.set) {
		context.session[key] = interpolate(action.set[key], context.session);
	}
	callback();
}
