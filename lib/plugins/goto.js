module.exports.safe = true;

/* 
Purpose:
  Interrupts script flow and jumps to another action by name (or any of the special jump keys: SELF, NEXT, or END)

Example:
  goto: jump_to_key || "SELF", "END", "NEXT"
*/

var verror = require("verror");

// eslint-disable-next-line no-unused-vars
module.exports.process = function (context) {
	module.exports.logger.trace("goto: " + this.goto);
	throw new verror.VError({
		name: "JumpResult",
		info: {
			goto: this.goto,
			path: this.path + ".goto"
		}
	}, "Jumping to new location");
};
