module.exports.safe = true;
module.exports.manual_interpolation = true;

/*
 Purpose:
 Executes an array of nested actions in sequence. Each action must pass, if any child action fails,
 the error will be returned and processing will stop. This is useful to turn any spot expecting a single
 action into a block of multiple actions.

 Normalization shortcut:
   An array (of actions)

 Example:
 actions:
  - {action1}
  - {action2}

 and: # (Alias)
   - {action1}
   - {action2}

 # Shortcut (array)
 - {action1}
 - {action2}
 */

var _ = require("lodash");
var verror = require("verror");

module.exports.normalize = function (action, normalize_action, path) {
	if (_.isArray(action)) {
		action = { actions: action };
	}
	if (_.has(action, "and")) {
		if (!_.isArray(action.and)) {
			throw new verror.VError({
				name: "ActionStructureError.actions",
				info: {
					path: path + ".and"
				}
			}, "The value of a .and action must be an array of actions");
		}
		action.actions = action.and;
		delete action.and;
	}
	if(_.has(action, "actions")) {
		// Normalize nested actions
		action.actions = normalize_action(action.actions, "actions");
		return action;
	}
};

module.exports.process = function (context) {
	// and action just executes the nested actions
	return context.processAction(this.actions);
};
