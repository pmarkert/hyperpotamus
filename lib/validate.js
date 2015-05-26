var _ = require("underscore");
var interpolate = require("./interpolate");
var async = require("async");
var fs = require("fs");
var path = require("path");
var logger = require("./logging").logger("hyperpotamus.validate");

module.exports.process_actions = process_actions;
module.exports.process_action = process_action;

function process_actions(actions, context, callback) {
	// Loop through each response validation step and verify
	async.eachSeries(actions, function(action, callback) {
		process_action(action, context, callback);
	}, callback);
}

function process_action(action, context, callback) {
	action = interpolate(action, context.session);
	// First filter to get a list of interested plugins
	var interested_plugins = _.filter(context.options.plugins, function(plugin) {
		var result = plugin.handles(action);
		return result;
	});
	if(!interested_plugins || interested_plugins.length===0)
		throw { message : "No plugins available to handle action", action : action };

	async.eachSeries(interested_plugins, function(plugin, action_callback) {
			if(plugin.process.length==2) { // Async plugin
				plugin.process.call(action, context, function(err) {
					// If the plugin returns an error (or not), evaluate against on_success and on_failure to figure out if we need to jump, fail, or proceed
					if(err) { // Jump or fail
						if(err.jump_to_key) {
							return action_callback( { message : null, jump_to_key: err.jump_to_key, action: action });
						}
						if(_.isString(err)) {
							err = { message : err };
						}
						if(action.on_failure) {
							// Abort processing of the current series of actions and start processing on_failure actions
							process_actions(action.on_failure, context, action_callback);
						}
						else {
							return action_callback({ error : err, action : action });
						}
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
					var err = plugin.process.call(action, context);
					if(err) { // Jump or fail
						if(err.jump_to_key) {
							return action_callback( { message : null, jump_to_key: err.jump_to_key, action: action });
						}
						if(_.isString(err)) {
							err = { message : err };
						}
						if(action.on_failure) {
							// Abort processing of the current series of actions and start processing on_failure actions
							process_actions(action.on_failure, context, action_callback);
						}
						else {
							return action_callback({ error : err, action : action });
						}
					}
					else {
						if(action.on_success) { // Jump
							return action_callback( { message : null, jump_to_key: action.on_success, action: action });
						}
						else { // Continue
							return action_callback();
						}
					}
			}
			else {
				throw { message : "Unexpected number of arguments for plugins process() method.", plugin : plugin.name };
			}
	}, callback);
}
