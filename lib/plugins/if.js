module.exports.safe = true;
module.exports.manual_interpolation = true;

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
  then:
    [ {actions} ]
*/

var _ = require("underscore");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "if")) {
		action.if = normalize_action(action.if);
		if (!_.has(action, "then")) {
			throw { message: "'if' action must have a .then property of actions" };
		}
		action.then = normalize_action(action.then);
		if (_.has(action, "else")) {
			action.else = normalize_action(action.else);
		}
		return action;
	}
}

module.exports.process = function (context, callback) {
	var self = this;
	var _if = context.interpolate(self.if, context.session);
	context.validate.process_action(_if, context, function (err) {
		if (err) {
			module.exports.logger.trace("if evaluated to false - " + JSON.stringify(_if));
			if (_.has(self, "else")) {
				context.validate.process_action(self.else, context, callback);
			}
			else { // otherwise, we failed the test, but there is no else, so just continue
				callback();
			}
		}
		else {
			module.exports.logger.trace("if evaluated to true - " + JSON.stringify(_if));
			context.validate.process_action(self.then, context, callback);
		}
	});
}
