module.exports.safe = true;

/* 
Purpose:
  Interrupts script flow and jumps to another action by name (or any of the special jump keys: SELF, NEXT, or END)

Example:
  goto: jump_to_key || "SELF", "END", "NEXT"
*/

module.exports.process = function(context) {
	if (this.goto) {
		module.exports.logger.trace("goto: " + this.goto);
		throw { goto: this.goto };
	}
};
