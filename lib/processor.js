var _ = require("lodash");
var fs = require("fs");
var yaml = require("js-yaml");

var async = require("async");
var load = require("./load");
var interpolate = require("./interpolate");
var normalize = require("./normalize");

var logging = require("./logging");
var logger = logging.logger("hyperpotamus.index");

var reserved_properties = ["on_success", "on_failure", "debugger"];

function process_script(script, session, options) {
	if (!options) {
		logger.debug("Options was null or empty, initializing defaults.");
		options = {};
	}
	else if (_.isFunction(options)) {
		logger.debug("Options was a function, so patching function as options.done");
		options = { done: options };
	}
	if (_.isUndefined(options.done) || !_.isFunction(options.done)) {
		logger.error("options.done was not a function.");
		throw new Error("Options.done must be a callback function with parameters (err, session).");
	}
	if (!script) {
		logger.warn("Script is null or empty.");
		return options.done({ message: "Script is null" }, session);
	}
	if (session && !_.isObject(session)) {
		logger.error("If session is specified, it must be an object with name/value properties.");
		options.done({ message: "Session is not a valid object" }, session);
	}
	script = normalize(script, options.plugins);
	if (!session) {
		logger.debug("Initializing empty session.");
		session = {};
	}
	var context = {
		options: options,
		session: session,
		interpolate: interpolate,
		process_action: process_action
	};
	// Now kick off the script by processing the first step
	process_step(_.first(script.steps), script, context);
}

function process_step(step, script, context) {
	if (!_.isObject(step) || _.isArray(step) || _.isFunction(step)) {
		logger.error("Step must be an standard object, not an array or function.");
		throw new Error("Step was not an object");
	}
	if (step.name) {
		logger.debug("Processing step - " + step.name);
	}
	else {
		logger.debug("Processing step #" + (_.indexOf(script.steps, step) + 1).toString());
	}
	logger.trace("Step is " + JSON.stringify(step));
	try {
		process_action(step.actions, context, function (err) {
			if(!err) {
				logger.debug("Response validation completed without error.");
			}
			if (context.options.after_validate) {
				logger.debug("About to invoke options.after_validate");
				context.options.after_validate(step, err, err.goto);
			}
			else {
				logger.trace("No options.after_validate to invoke.");
			}
			if (err && !err.goto) {
				err.step = step;
				err.session = context.session;
				logger.warn("Error was returned and no .goto specified: " + JSON.stringify(err));
				return context.options.done({ message: "Validation error", error: err }, context);
			}
			var next_step = null;
			if (err && err.goto !== "NEXT") {
				logger.debug("Validation returned with .goto=" + err.goto);
				if (err.goto === "SELF") { // Jump to the same request again (warning, could cause indefinite loops)
					logger.trace("Special case, jumping to 'SELF'");
					next_step = step;
				}
				else {
					logger.debug("goto specified, jumping to '" + err.goto + "'");
					if (err.goto !== "END") {
						next_step = _.find(script.steps, { name: err.goto });
						if (!next_step) {
							err.step = step;
							err.session = context.session;
							logger.warn("Could not find next step from goto=" + err.goto);
							return context.options.done({ message: "Could not find step", step: err.goto }, context);
						}
					}
				}
			}
			else {
				if (err && err.goto === "NEXT") {
					logger.debug("Jumping to next request.");
				}
				else {
					logger.trace("No goto, so looking for the next step in sequence");
				}
				var next_index = _.indexOf(script.steps, step) + 1;
				if (next_index > 0 && next_index < script.steps.length) {
					logger.trace("Next step sequence is " + next_index);
					next_step = script.steps[next_index];
				}
				else {
					logger.debug("Reached the end of the script by sequence.");
				}
			}
			if (context.options.request_completed) {
				logger.debug("About to invoke options.request_completed");
				context.options.request_completed(step, next_step, script, context);
			}
			else {
				logger.trace("No options.request_completed to invoke.");
			}
			if (!next_step) {
				logger.debug("No more steps, script completed.");
				return context.options.done(null, context); // Reached the end of the script
			}
			setImmediate(function () {
				process_step(next_step, script, context);
			});
		});
	} 
	catch (err) {
			logger.fatal("Validation failed - " + JSON.stringify(err, null, "  "));
			throw err;
	}
}

function process_action(action, context, callback) {
	if (_.isArray(action)) {
		// Loop through each response validation step and verify
		return async.eachSeries(action, function (single_action, callback) {
			process_action(single_action, context, callback);
		}, callback);
	}
	// Each action must have a single property (other than on_success/on_failure which corresponds to the plugin name)
	// Find all plugins that match any non-reserved property names
	var plugins = _.keys(_.pick(context.options.plugins, _.difference(_.keys(action), reserved_properties)));

	if (plugins.length == 0) {
		throw { message: "No plugins available to process action - " + JSON.stringify(action), action: action };
	}
	if (plugins.length > 1) {
		throw { message: "Multiple plugins available to process action - " + JSON.stringify(action) + ", " + JSON.stringify(plugins), action: action, plugins: plugins };
	}

	var plugin = context.options.plugins[plugins[0]];
	if (!plugin.manual_interpolation) {
		action = context.interpolate(action, context.session, ["on_success", "on_failure"]); // Need to exclude these so we can defer the interpolation
	}
	if (plugin.process.length == 2) { // Async plugin
		if (action.debugger) {
			// Breakpoint triggered by debugger property on action
			debugger;
		}
		// For hdb debugging, step into this next line to action.process
		plugin.process.call(action, context, function (err) {
			handle_action_response(err, context, action, callback);
		});
	}
	else if (plugin.process.length == 1) { // Synchronous plugin
		if (action.debugger) {
			// Breakpoint triggered by debugger property on action
			debugger;
		}
		// For hdb debugging, step into this next line to action.process
		var err = plugin.process.call(action, context);
		handle_action_response(err, context, action, callback);
	}
	else {
		throw { message: "Unexpected number of arguments for plugins process() method.", plugin: plugin.name };
	}
};

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
			process_action(action.on_failure, context, action_callback);
		}
		else {
			return action_callback({ error: err, action: action });
		}
	}
	else {
		if (action.on_success) { // Jump
			// Abort processing of the current series of actions and start processing on_success actions
			process_action(action.on_success, context, action_callback);
		}
		else { // Continue
			return action_callback();
		}
	}
}

function instance(options) {
	if (_.isFunction(options)) {
		options = { safe: false, done: options };
	}
	options = options || { safe: false };
	var loader = load(options);
	options.plugins = loader.plugins;
	return {
		options: options,
		load: loader,
		interpolate: interpolate,
		normalize: function (script) {
			return normalize(script, this.options.plugins);
		},
		process: function (script, session, callback) {
			var local_options = options;
			if (_.isFunction(callback)) {
				local_options = { done: callback };
				_.defaults(local_options, options);
			}
			process_script(script, session, local_options);
		}
	};
};

// Re-expose components
module.exports.interpolate = interpolate;
module.exports.processor = instance;
module.exports.logging = logging;

// Expose shortcut feature set
module.exports.yaml = {
	process_file: function (filename, session, options) {
		var processor = instance(options);
		var script = processor.load.scripts.yaml.file(filename);
		processor.process(script, session);
	},
	process_text: function (script_text, session, options) {
		var processor = instance(options);
		var script = processor.load.scripts.yaml.text(script_text);
		processor.process(script, session);
	}
}
