var _ = require("underscore");

module.exports.name = "not";
module.exports.safe = true;

/* 
Purpose:
  Executes a single nested action, reversing the failure expectation
  if the nested action fails, then the error is swallowed and processing continues as successful
  if the nested action does not fail, however, an error is specifically thrown

Example:
  not: 
   {action}
*/

module.exports = { 
	normalize: normalize,
	handles: handles,
	process: process
}

function normalize(action, normalize_action) {
	if(handles(action)) {
		if(_.isArray(action.not)) {
			throw new Error("\"not\" action must be a single action (not an array)");
		}
		action.not = normalize_action(action.not);
		return action;
	}
}

function handles(action) {
	return _.isObject(action) && !_.isUndefined(action.not);
}

function process(context, callback) {
	var self = this;
	if(this.debugger) debugger;
	context.validate.process_action(self.not, context, function(err) {
		if(this.debugger) debugger;;
		// Reverse the success/fail logic here
		if(err) {
			return callback(); // Continue processing
		}
		else {
			return callback({ message : "NOT: Nested action should not have succeeded" });
		}
	});
}
