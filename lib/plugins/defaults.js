module.exports.name = "defaults";
module.exports.safe = true;

var logger = require("../logging").logger("hyperpotamus.plugins." + module.exports.name);

/*
  Set context values only if they are not already set 
*/

var _ = require("underscore");

module.exports.handles = function(action) {
	return _.isObject(action.defaults);
}

module.exports.process = function(context) {
	for(var key in this.defaults) {
		if(!_.has(context.session,key)) {
			context.session[key] = this.defaults[key];
		}
	}
}
