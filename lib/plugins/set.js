var _ = require("underscore");

module.exports.name = "set";

module.exports.safe = true;

module.exports.handles = function(action) {
	return _.isObject(action.set);
}

module.exports.process = function(context, callback) {
	if(this.debugger) debugger;
	for(var key in this.set) {
		context.session[key] = this.set[key];
	}
	callback();
}
