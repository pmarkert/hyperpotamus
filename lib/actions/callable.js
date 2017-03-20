module.exports.safe = true;
module.exports.manual_interpolation = true;

/*
Purpose:
  Allows an action or step to be called, but will be skipped by the top-level processor
*/

var _ = require("lodash");
module.exports.normalize = function(action, normalize_action) {
	if(_.has(action, "callable")) {
		action.callable = normalize_action(action.callable, "callable");
		return action;
	}
};

module.exports.process = function (context) {
	// noop - Actions are executed directly by the call action instead
};
