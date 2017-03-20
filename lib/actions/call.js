module.exports.safe = true;

/*
Purpose:
  Calls another named step and then continues processing when that step is finished.

Example:
  call: "Login"
*/

var _ = require("lodash");
var verror = require("verror");

module.exports.process = function (context) {
	module.exports.logger.trace("call: " + this.call);
	if(!_.isString(this.call)) {
		throw new verror.VError({
			name: "InvalidCallValue",
			info: {
				call: this.call,
				path: this.path + ".call"
			}
		}, ".call value must be a string value");
	}
	var step = context.findStep(this.call);
	if(!_.isNil(step.callable)) {
		// Directly invoke the callable actions because callable.process() is a noop.
		return context.processAction(step.callable); 
	}
	else {
		return context.processAction(step);
	}
};
