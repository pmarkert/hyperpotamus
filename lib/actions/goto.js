module.exports.safe = true;

/*
Purpose:
  Interrupts script flow and jumps to another action by name (or any of the special jump keys: SELF, NEXT, or END)

Example:
  goto: jump_to_key || "SELF", "END", "NEXT"
*/

var _ = require("lodash");
var verror = require("verror");

module.exports.process = function (context) {
	module.exports.logger.trace("goto: " + this.goto);
	if(!_.isString(this.goto)) {
		throw new verror.VError({
			name: "InvalidGotoValue",
			info: {
				goto: this.goto,
				path: this.path + ".goto"
			}
		}, ".goto value must be a string value");
	}
	throw new context.ProcessingDirective({ goto: this.goto, context });
};
