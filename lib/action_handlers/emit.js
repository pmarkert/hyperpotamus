var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.name = "emit";

module.exports.handles = function(action) {
	return _.isString(action.emit);
}

module.exports.process = function(action, context, callback) {
	if(context.options.emit) context.options.emit(interpolate(action.emit, context.session));
	callback();
}
