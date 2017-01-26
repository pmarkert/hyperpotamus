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
var Promise = require("bluebird");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "or")) {
		if (!_.isArray(action.or)) {
			action.or = [action.or];
		}
		action.or = _.map(action.or, (a, index) => {
			return normalize_action(a, `or.${index}`);
		});
		return action;
	}
};

module.exports.process = function (context) {
	// Process each item in sequence.
	// When the first item succeeds, short-circut and complete
	// If all items fail, then throw error.
	return Promise.any(this.or.map(action => context.processAction(action)));
};
