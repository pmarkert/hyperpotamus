var _ = require("underscore");
var async = require("async");

module.exports.name = "or";
module.exports.safe = true;

/* 
Purpose:
  Executes each child-action in sequence until at least one of the actions succeeds. 
  If all of the child actions fail then an error will be explicitly raised.
  Will short-circuit evaluation at the first success

Example:
  or:
   - {action1}
   - {action2}
*/

module.exports = { 
	normalize: normalize,
	handles: handles,
	process: process
}

function normalize(action, normalize_action) {
	if(handles(action)) {
		if(!_.isArray(action.or)) {
			throw new Error("\"or\" action must be an array of actions");
		}
		action.or = _.map(action.or, normalize_action);
		return action;
	}
}

function handles(action) {
	return _.isObject(action) && !_.isUndefined(action.or);
}

function process(context, callback) {
	// Process each item in sequence.
	// When the first item succeeds, short-circut and complete
	// If all items fail, then throw error.
	async.detectSeries(this.or, function(child_action, detection_callback) {
		context.validate.process_action(child_action, context, function(err) {
			detection_callback(!err);
		});
	}, function(succeeding_action) {
		if(succeeding_action)
			callback();
		else
			callback( { message : "OR: No child actions succeeded" } );
	});
}
