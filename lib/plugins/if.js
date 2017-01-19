module.exports.safe = true;
module.exports.manual_interpolation = [ "if", "then", "else" ];

/* 
Purpose:
  Executes a single nested action, reversing the failure expectation
  if the nested action fails, then the error is swallowed and processing continues as successful
  if the nested action does not fail, however, an error is specifically thrown

Example:
  if: 
    {action}
  then:
    [ {actions} ]
  else:
    [ {actions} ]
*/

var _ = require("lodash");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "if")) {
		action.if = normalize_action(action.if, "if");
		if (_.has(action, "then")) {
			action.then = normalize_action(action.then, "then");
		}
		if (_.has(action, "else")) {
			action.else = normalize_action(action.else, "else");
		}
		return action;
	}
};

module.exports.process = function (context) {
	var self = this;
	var _if = context.interpolate(self.if);
	return context.processAction(_if).then(() => {
		module.exports.logger.trace("if evaluated to true - " + JSON.stringify(_if));
		if (_.has(self, "then")) {
			module.exports.logger.trace("invoking .then block");
			return context.processAction(self.then);
		}
		else { // otherwise, we failed the test, but there is no else, so just continue
			module.exports.logger.trace("No .then block to execute, continuing.");
			return context;
		}
	}, () => {
		module.exports.logger.trace("if evaluated to false - " + JSON.stringify(_if));
		if (_.has(self, "else")) {
			module.exports.logger.trace("invoking .else block");
			return context.processAction(self.else);
		}
		else { // otherwise, we failed the test, but there is no else, so just continue
			module.exports.logger.trace("No .else block to execute, continuing.");
			return context;
		}
	});
};
