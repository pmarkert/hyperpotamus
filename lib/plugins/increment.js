var _ = require("underscore");

module.exports.name = "increment";

module.exports.handles = function(action) {
	return _.isObject(action.increment);
}

module.exports.process = function(action, context, callback) {
	if(action.debugger) debugger;
	for(var key in action.increment) {
		context.session[key] = (parseInt(context.session[key]) + parseInt(action.increment[key])).toString();
	}
	callback();
}
