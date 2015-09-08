var _ = require("underscore");
var logger = require("../logging").logger("hyperpotamus.plugins.if");

module.exports.name = "if";
module.exports.safe = true;

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

module.exports = { 
	normalize: normalize,
	handles: handles,
	process: process,
	manual_interpolation: true
}

function normalize(action, normalize_action) {
	if(handles(action)) {
		if(_.isArray(action.if)) {
			throw new Error("\"if\" action must be a single action (not an array)");
		}
		action.if = normalize_action(action.if);
		if(_.isUndefined(action.then)) {
			throw new Error("\"if\" action must have a .then action or array");
		}
		if(!_.isArray(action.then)) {
			action.then = [ action.then ];
		}
		action.then = _.map(action.then, normalize_action);
		if(!_.isUndefined(action["else"])) {
			if(!_.isArray(action["else"])) {
				action["else"] = [ action["else"] ];
			}
			action["else"] = _.map(action["else"], normalize_action);
		}
		return action;
	}
}

function handles(action) {
	return _.isObject(action) && !_.isUndefined(action.if);
}

function process(context, callback) {
	var self = this;
	self.if = context.interpolate(self.if, context.session);
	context.validate.process_action(self.if, context, function(err) {
		if(err) {
			logger.trace("if evaluated to false - " + JSON.stringify(self.if));
			if(!_.isUndefined(self["else"])) {
				context.validate.process_actions(self["else"], context, callback);
			}
			else { // otherwise, we failed the test, but there is no else, so just continue
				callback();
			}
		}
		else {
			logger.trace("if evaluated to true - " + JSON.stringify(self.if));
			context.validate.process_actions(self.then, context, callback);
		}
	});
}
