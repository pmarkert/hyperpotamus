var _ = require("underscore");
var logger = require("../logging").logger("hyperpotamus.plugins.goto");

module.exports.name = "goto";
module.exports.safe = true;

/* 
Purpose:
  Interrupts script flow and jumps to another action by name (or any of the special jump keys: SELF, NEXT, or END)

Example:
  goto: jump_key
*/

module.exports = { 
	handles: handles,
	process: process
}

function handles(action) {
	return !_.isUndefined(action.goto);
}

function process(context) {
	if(this.goto) {
		logger.trace("goto: " + this.goto);
		return { jump_to_key : this.goto };
	}
}
