var _ = require("underscore");

module.exports.name = "increment";

module.exports.handles = function(action) {
	return _.isObject(action.increment);
}

module.exports.process = function(context) {
	if(this.debugger) debugger;
	for(var key in this.increment) {
		context.session[key] = (parseInt(context.session[key]) + parseInt(this.increment[key])).toString();
	}
}
