var _ = require("underscore");

module.exports.name = "not";

module.exports.safe = true;

module.exports.normalize = function(action, normalize_action) {
	if(_.isObject(action) && !!action.not) {
		// TODO - Warning about not honoring on_ events for nested element
		action.not = normalize_action(action.not);
		return action;
	}
}

module.exports.handles = function(action) {
	return _.isObject(action) && action.not;
}

module.exports.process = function(context, callback) {
	var self = this;
	if(this.debugger) debugger;
	context.process_action(this.not, context, function(err) {
		debugger;
		// Reverse the success/fail logic here
		if(err) {
			if(self.not.on_success) {
				return callback( { message : null });
			}
			return callback(); // Continue processing
		}
		else {
			return callback({ message : "Action should not have succeeded" });
		}
	});
}
