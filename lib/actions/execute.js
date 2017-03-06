module.exports.safe = true;

/*
Purpose:
  Executes another step and then continues processing when that step is finished.

Example:
  goto: jump_to_key || "SELF", "END", "NEXT"
*/

var _ = require("lodash");
var verror = require("verror");

module.exports.process = function (context) {
	module.exports.logger.trace("goto: " + this.goto);
	if(!_.isString(this.execute)) {
		throw new verror.VError({
			name: "InvalidExecuteValue",
			info: {
				goto: this.execute,
				path: this.path + ".execute"
			}
		}, ".execute value must be a string value");
	}
	var step = context.findStep(this.execute);
	return context.processAction(step);
};
