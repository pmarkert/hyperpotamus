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

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "not")) {
		action.not = normalize_action(action.not);
		return action;
	}
};

module.exports.process = function (context) {
	var self = this;
	context.process_action(self.not, context).then(() => {
		return Promise.reject(new Error("not: nested action should not have succeeded"));
	}).catch(err => {
		return Promise.resolve();
	});;
};
