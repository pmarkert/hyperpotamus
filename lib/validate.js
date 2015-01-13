var _ = require("underscore");
var async = require("async");
var fs = require("fs");
var path = require("path");

module.exports = function(step, context, callback, options) {
	var handlers = (options && options.handlers) || require("./handlers")();

	function process_action(action, context, callback) {
		// First filter to get a list of interested handlers
		var interested_handlers = _.filter(handlers, function(handler) {
			var result = handler.handles(action);
			return result;
		});
		async.eachSeries(interested_handlers, function(handler, action_callback) {
			handler.process(action, context, function(err, compare, value) {
				// If the handler returns an error (or not), evaluate against on_success and on_failure
				// to figure out if we need to jump, fail, or proceed
				if(err) { // Jump or fail
					return action_callback({ message: err + ": " + compare + " vs. " + value, jump_to_key: action.on_failure });
				}
				else {
					if(action.on_success) { // Jump
						return action_callback( { message : null, jump_to_key: action.on_success });
					}
					else { // Continue
						return action_callback();
					}
				}
			}, process_action);
		}, callback);
	}

	// Loop through each response validation step and verify
	async.eachSeries(step.response.actions, function(validation, callback) {
		process_action(validation, context, callback);
	}, function(err) {
		if(err) return callback(err.message, err.jump_to_key);
		return callback();
	});
}
