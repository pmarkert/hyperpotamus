var _ = require("underscore");
var async = require("async");

module.exports.name = "or";

module.exports.safe = true;

module.exports.normalize = function(action, normalize_action) {
	if(_.isObject(action) && !!action.or) {
		if(_.isArray(action.or)) {
			action.or = { actions: action.or };
		}
		// TODO - Warning about not honoring on_ events for nested element
		action.or.actions = _.map(action.or.actions, normalize_action);
		return action;
	}
}

module.exports.handles = function(action) {
	return _.isObject(action) && _.isObject(action.or) && _.isArray(action.or.actions);
}

module.exports.process = function(action, context, callback, process_action) {
	// Need to process each item in sequence.
	// When the first item succeeds, short-circut and complete
	// If all items fail, then throw error.
	async.detectSeries(action.or.actions, function(child_action, detection_callback) {
		process_action(child_action, context, function(err) {
			detection_callback(!err);
		});
	}, function(succeeding_action) {
		if(succeeding_action)
			callback();
		else
			callback( { message : "No child actions succeeded" } );
	});
}
