var _ = require("lodash");
var assert = require("assert");
var async = require("async");
var normalize = require("./normalize");
var Plugins = require("./plugins");
var Context = require("./context");

var logger = require("./logging").logger("hyperpotamus.index");

var reserved_properties = ["on_success", "on_failure", "debugger"];

var default_options = {
	emit: console.log,
	safe: false,
	default_session: {},
	response_defaults: { status: 200 }
};

function Processor(options) {
	var self = this;
	self.plugins = new Plugins();
	if (_.isFunction(options)) {
		self.options = { done: options };
	}
	else {
		self.options = _.defaults({}, options, default_options);
		if (!_.isNil(self.options.plugins)) {
			self.add_plugins(options.plugins);
		}
	}

	self.process_script = process_script;
	self.process_step = process_step;
	self.process_action = process_action;

	self.normalize = function (script) {
debugger;
		if(!_.isNil(script.plugins)) {
			self.plugins.load(script.plugins);
		}
		return normalize(script, self.plugins);
	};

	self.add_plugins = function add_plugins(to_load) {
		self.plugins.load(to_load);
	};

	function process_script(script, session, done, first_step) {
		var done = _.defaultTo(done, self.options.done);

		assert(_.isFunction(done), "either options.done or done() function must be specified");
		assert(!_.isNil(script), "script is null or empty");
		assert(_.isNil(session) || _.isObject(session), "If session is specified, it must be an object with name/value properties.");

		script = self.normalize(script);

		logger.debug("Initializing new session context.");
		var context = new Context(session, self, done);

		// Find the first step to process
		var step;
		if (first_step) {
			step = _.find(script.steps, { name: first_step });
			if (!step) {
				return options.done({ message: "Could not find starting_step - " + first_step }, session);
			}
		}
		else {
			step = _.first(script.steps);
		}
		// And kick off the script with the first step
		process_step(step, script, context);
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
				if (!err) {
					logger.debug("Response validation completed without error.");
				}
				if (self.after_validate) {
					logger.debug("About to invoke options.after_validate");
					self.after_validate(step, err, err.goto);
				}
				else {
					logger.trace("No options.after_validate to invoke.");
				}
				if (err && !err.goto) {
					err.step = step;
					err.session = context.session;
					logger.warn("Error was returned and no .goto specified: " + JSON.stringify(err));
					return context.done({ message: "Validation error", error: err }, context);
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
								return context.done({ message: "Could not find step", step: err.goto }, context);
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
				if (self.request_completed) {
					logger.debug("About to invoke options.request_completed");
					self.request_completed(step, next_step, script, context);
				}
				else {
					logger.trace("No options.request_completed to invoke.");
				}
				if (!next_step) {
					logger.debug("No more steps, script completed.");
					return context.done(null, context); // Reached the end of the script
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
		var properties = _.difference(_.keys(action), reserved_properties);
		var matching_plugins = self.plugins.findPlugin(properties);

		if (matching_plugins.length == 0) {
			throw { message: "No plugins available to process action - " + JSON.stringify(action), action: action };
		}
		if (matching_plugins.length > 1) {
			throw { message: "Multiple plugins available to process action - " + JSON.stringify(action) + ", " + JSON.stringify(plugins), action: action, matching_plugins: matching_plugins };
		}

		var plugin = self.plugins.plugins[matching_plugins[0]];
		if(context.options.safe && !plugin.safe) {
			throw { message: "Unsafe plugin cannot be executed in safe-mode" };
		}
		if (!plugin.manual_interpolation) {
			action = context.interpolate(action, context.session, ["on_success", "on_failure"]); // Need to exclude these so we can defer the interpolation
		}
		if (plugin.process.length == 2) { // Async plugin

			// HDB: action debugging - step into the next line
			if (action.debugger) {
				debugger;
			}

			plugin.process.call(action, context, function (err) {
				handle_action_response(err, context, action, callback);
			});
		}
		else if (plugin.process.length == 1) { // Synchronous plugin

			// HDB: action debugging - step into the next line
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
				context.error = err;
				context.session.error = err;
				// Abort processing of the current series of actions and start processing on_failure actions
				process_action(action.on_failure, context, function(err) {
					delete context.error;
					delete context.session.error;
					action_callback(err);
				});
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
}


module.exports = Processor;

