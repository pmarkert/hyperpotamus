var _ = require("underscore");
var async = require("async");
var fs = require("fs");
var path = require("path");
var logger = require("./logging").logger("hyperpotamus.validate");

var reserved_properties = ["on_success", "on_failure", "debugger"];

module.exports.process_actions = process_actions;
module.exports.process_action = process_action;

function process_actions(actions, context, callback) {
	// Loop through each response validation step and verify
	async.eachSeries(actions, function (action, callback) {
		process_action(action, context, callback);
	}, callback);
}

function process_action(action, context, callback) {
	// Each action must have a single property (other than on_success/on_failure which corresponds to the plugin name)
	// Find all plugins that match any non-reserved property names
	var plugins = _.keys(_.pick(context.options.plugins, _.difference(_.keys(action), reserved_properties)));

	if (plugins.length == 0) {
		throw { message: "No plugins available to process action", action: action };
	}
	if (plugins.length > 1) {
		throw { message: "Multiple plugins available to process action", action: action, plugins: plugins };
	}

	var plugin = context.options.plugins[plugins[0]];
	if (!plugin.manual_interpolation) {
		action = context.interpolate(action, context.session);
	}
	if (plugin.process.length == 2) { // Async plugin
		if (action.debugger) {
			debugger;
		}
		plugin.process.call(action, context, function (err) {
			handle_action_response(err, context, action, callback);
		});
	}
	else if (plugin.process.length == 1) { // Synchronous plugin
		if (action.debugger) {
			debugger;
		}
		var err = plugin.process.call(action, context);
		handle_action_response(err, context, action, callback);
	}
	else {
		throw { message: "Unexpected number of arguments for plugins process() method.", plugin: plugin.name };
	}
}

function handle_action_response(err, context, action, action_callback) {
	// If the plugin returns an error (or not), evaluate against on_success and on_failure to figure out if we need to jump, fail, or proceed
	if (err) { // Jump or fail
		if (_.isString(err)) {
			err = { message: err };
		}
		if (_.has(err, "goto")) {
			return action_callback({ message: null, goto: err.goto, action: action });
		}
		if (action.on_failure) {
			// Abort processing of the current series of actions and start processing on_failure actions
			process_actions(action.on_failure, context, action_callback);
		}
		else {
			return action_callback({ error: err, action: action });
		}
	}
	else {
		if (action.on_success) { // Jump
			// Abort processing of the current series of actions and start processing on_success actions
			process_actions(action.on_success, context, action_callback);
		}
		else { // Continue
			return action_callback();
		}
	}
}
