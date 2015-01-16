var _ = require("underscore");
var async = require("async");
var fs = require("fs");
var path = require("path");

module.exports = function(step, context, callback, plugins) {
	if(!plugins) plugins = require("./load").plugins.defaults();

	function process_action(action, context, callback) {
		// First filter to get a list of interested plugins
		var interested_plugins = _.filter(plugins, function(plugin) {
			var result = plugin.handles(action);
			return result;
		});
		async.eachSeries(interested_plugins, function(plugin, action_callback) {
			plugin.process(action, context, function(err, compare, value) {
				// If the plugin returns an error (or not), evaluate against on_success and on_failure
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
