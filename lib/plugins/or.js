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

var _ = require("lodash");
var async = require("async");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "or")) {
		if (!_.isArray(action.or)) {
			action.or = [action.or];
		}
		action.or = _.map(action.or, normalize_action);
		return action;
	}
};

module.exports.process = function (context, callback) {
	// Process each item in sequence.
	// When the first item succeeds, short-circut and complete
	// If all items fail, then throw error.
	async.detectSeries(this.or, function (child_action, detection_callback) {
		context.process_action(child_action, context, function (err) {
			detection_callback(!err);
		});
	}, function (succeeding_action) {
		if (succeeding_action) {
			callback();
		} else {
			callback({ message: "OR: No child actions succeeded" });
		}
	});
};
