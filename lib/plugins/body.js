var _ = require("underscore");

module.exports.name = "body";

module.exports.safe = true;

/**
 * Saves the body of the response into a context variable
 */
module.exports.handles = function(action) {
	return _.isString(action.body);
}

module.exports.process = function(context) {
	context.session[this.body] = context.body;
}
