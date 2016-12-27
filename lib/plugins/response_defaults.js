module.exports.safe = true;
module.exports.manual_interpolation = [ "response_defaults" ];

/* 
Purpose:
  Sets default actions to be processed on a request if no other actions are specified

Syntax:
  - response_defaults:
      - action1
      - action2
*/

var _ = require("lodash");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "response_defaults")) {
		action.response_defaults = normalize_action(action.response_defaults);
		return action;
	}
};

module.exports.process = function(context) {
	module.exports.logger.trace("Overwriting response_defaults with " + JSON.stringify(this.response_defaults, null, 2));
	context.options.response_defaults = this.response_defaults;
}
