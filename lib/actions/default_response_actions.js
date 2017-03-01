module.exports.safe = true;
module.exports.manual_interpolation = ["default_response_actions"];

/* 
Purpose:
  Sets default actions to be processed on a request if no other actions are specified

Syntax:
  - default_response_actions:
      - action1
      - action2
*/

var _ = require("lodash");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "default_response_actions")) {
		action.default_response_actions = normalize_action(action.default_response_actions, "default_response_actions");
		return action;
	}
};

module.exports.process = function (context) {
	module.exports.logger.trace("Overwriting hyperpotamus.default_response_actions with " + JSON.stringify(this.default_response_actions, null, 2));
	context.setSessionValue("hyperpotamus.default_response_actions", this.default_response_actions);
};
