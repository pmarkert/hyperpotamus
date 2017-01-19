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

var _ = require("lodash");
var verror = require("verror");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "not")) {
		action.not = normalize_action(action.not, "not");
		return action;
	}
};

module.exports.process = function (context) {
	return context.processAction(this.not).then(() => {
		throw new verror.VError({
			name: "NotConditionFailed"
		}, "not: nested action should not have succeeded");
	}, () => context);
};
