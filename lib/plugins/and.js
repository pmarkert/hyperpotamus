var _ = require("underscore");
var async = require("async");

module.exports.name = "and";

module.exports.safe = true;

module.exports.normalize = function(action, normalize_action) {
	if(_.isObject(action) && !!action.and) {
		if(_.isArray(action.and)) {
			action.and = { actions: action.and };
		}
		// TODO - Warning about not honoring on_ events for nested element
		action.and.actions = _.map(action.and.actions, normalize_action);
		return action;
	}
}

module.exports.handles = function(action) {
	return _.isObject(action) && _.isObject(action.and) && _.isArray(action.and.actions);
}

module.exports.process = function(action, context, callback, process_action) {
	if(action.debugger) debugger;
	// Need to process each item in sequence.
	// When the first item fails, short-circut and complete
	// If all items succeed, then return success.
	async.eachSeries(action.and.actions, function(child_action, detection_callback) {
		process_action(child_action, context, function(err) {
			detection_callback(err);
		});
	}, function(err) {
		if(err)
			callback( { message : "At least one action failed -" + err } );
		else
			callback();
	});
}
