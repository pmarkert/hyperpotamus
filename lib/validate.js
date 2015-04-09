var _ = require("underscore");
var interpolate = require("./interpolate");
var async = require("async");
var fs = require("fs");
var path = require("path");

module.exports = function(step, context, callback) {

	function process_action(action, context, callback) {
		context.process_action = process_action;
		action = interpolate(action, context.session);
		// First filter to get a list of interested plugins
		var interested_plugins = _.filter(context.options.plugins, function(plugin) {
			var result = plugin.handles(action);
			return result;
		});
		if(!interested_plugins || interested_plugins.length===0)
			throw new Error("No plugins available to handle action - " + JSON.stringify(action));

		async.eachSeries(interested_plugins, function(plugin, action_callback) {
			if(plugin.process.length==2) { // Async plugin
				plugin.process.call(action, context, function(err) {
					// If the plugin returns an error (or not), evaluate against on_success and on_failure to figure out if we need to jump, fail, or proceed
					if(err) { // Jump or fail
						err.failing_action = action;
						err.jump_to_key = action.on_failure;
						return action_callback(err);
					}
					else {
						if(action.on_success) { // Jump
							return action_callback( { message : null, jump_to_key: action.on_success, action: action });
						}
						else { // Continue
							return action_callback();
						}
					}
				});
			}
			else if(plugin.process.length==1) { // Synchronous plugin
				try {
					plugin.process.call(action, context);
					if(action.on_success) { // Jump
						return action_callback( { message : null, jump_to_key: action.on_success, action: action });
					}
					else { // Continue
						return action_callback();
					}
				}
				catch(err) {
					// If the plugin returns an error (or not), evaluate against on_success and on_failure
					// to figure out if we need to jump, fail, or proceed
					err.failing_action = action;
					err.jump_to_key = action.on_failure;
					return action_callback(err);
				}
			}
			else {
				throw new Error("Unexpected number of arguments for plugins process() method.", plugin);
			}
		}, callback);
	}

	// Loop through each response validation step and verify
	async.eachSeries(step.actions, function(action, callback) {
		process_action(action, context, callback);
	}, function(err) {
		if(err) return callback(err);
		return callback();
	});
}
