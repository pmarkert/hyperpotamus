module.exports.name = "body";
module.exports.safe = true;

var logger = require("../logging").logger("hyperpotamus.plugins." + module.exports.name);

/**
 * Saves the body of the response into a context variable
 */

var _ = require("underscore");

module.exports.handles = function(action) {
	return _.isString(action.body);
}

module.exports.process = function(context) {
	context.session[this.body] = context.body;
}
