var _ = require("underscore");

module.exports.name = "defaults";

module.exports.safe = true;

module.exports.handles = function(action) {
	return _.isObject(action.defaults);
}

module.exports.process = function(context) {
	for(var key in this.defaults) {
		if(!context.session[key]) {
			context.session[key] = this.defaults[key];
		}
	}
}
