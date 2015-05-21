var _ = require("underscore");
var async = require("async");

module.exports.name = "and";
module.exports.safe = true;

/* 
Purpose:
  Executes an array of nested actions (must be an array, even if only containing a single element)
  All actions must pass for the and action to pass. If any child action fails, the error will be passed through.
  Will short-circuit success at the first failure.

Example:
  and:
   - {action1}
   - {action2}
*/

module.exports = { 
	normalize: normalize,
	handles: handles,
	process: process
}

function normalize(action, normalize_action) {
	if(_.isArray(action)) {
		action = { and : action };
	}
	if(handles(action)) {
		if(!_.isArray(action.and)) {
			throw new Error("\"and\" action must be an array of actions");
		}
		action.and = _.map(action.and, normalize_action);
		return action;
	}
}

function handles(action) {
	return _.isObject(action) && !_.isUndefined(action.and);
}

function process(context, callback) {
	if(this.debugger) debugger;
	// and action just executes the nested actions
	context.validate.process_actions(this.and, context, callback);
}
