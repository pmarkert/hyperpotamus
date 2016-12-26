var _ = require("lodash");
var assert = require("assert");
var normalizer = require("./normalize");
var yaml = require("./yaml");
var path = require("path");
var Plugins = require("./plugins");
var Context = require("./context");
var Promise = require("bluebird");
var error = require("./error");

var logger = require("./logging").logger("hyperpotamus.index");

var default_options = {
	emit: console.log,
	safe: false,
	auto_load_plugins: false,
	default_session: {},
	response_defaults: { status: 200 }
};

function Processor(options) {
	var self = this;
	self.options = _.defaults({}, options, default_options);
	self.plugins = new Plugins();
	self.loadFile = loadFile;
	self.loadString = loadString;
	self.normalize = normalize;
	self.process = process;
	self.processFile = processFile;

	function loadFile(script_path) {
		var script = yaml.loadFile(script_path, self.options.safe);
		if(self.options.auto_load_plugins && !_.isNil(script.plugins)) {
			self.plugins.load(script.plugins, path.dirname(script_path));
		}
		return script;
	}

	function loadString(script_string) {
		var script = yaml.load(script_string, self.options.safe);
		if(self.options.auto_load_plugins && !_.isNil(script.plugins)) {
			self.plugins.load(script.plugins, path.dirname(script_path));
		}
		return script;
	}

	function normalize(script) {
		return normalizer(script, self.plugins);
	};

	function processFile(script_path, session, first_step) {
		var script = loadFile(script_path);
		return process(script, session, first_step);
	}

	function process(script, session, first_step) {
		assert(!_.isNil(script), "script is null or empty");
		assert(_.isNil(session) || _.isObject(session), "If session is specified, it must be an object with name/value properties.");

		script = self.normalize(script);

		logger.debug("Initializing new session context.");
		var context = new Context(session, self, process_action, handle_directive);

		// Find the first step to process
		var step = first_step ? _.find(script.steps, { name: first_step }) : _.first(script.steps);
		if (!step) {
			throw new error.StepNotFoundError(first_step || "#1");
		}
		// And kick off the script with the first step
		return process_step(step, context);

		function process_step(step, context) {
			logger.debug("Processing step - " + (step.name || "#" + (_.indexOf(script.steps, step) + 1).toString()));
			logger.trace("Step is " + yaml.dump(step));
			context.current_step = step;
			return process_action(step.actions, context).then(() => {
				logger.debug("Step processed successfully.");
				var next_index = _.indexOf(script.steps, step) + 1;
				var next_step = _.nth(script.steps, next_index);
				return goto_next_step(next_step, context);
			}).catch(e => {
				if(_.has(e, "goto")) return handle_directive(e, step)
				// If it's not already an error object, let's wrap it in one
				if(!_.isError(e)) {
					e = new Error(e.message || e);
				}
				e.step = step;
				throw e; 
			});
		}

		function handle_directive(directive, step) {
			var next_step;
			logger.debug("Action processing completed with goto directive for - " + directive.goto);

			// Special targets
			if(directive.goto === "END") {
				next_step = null;
			}
			else if (directive.goto === "SELF") { // Jump to the same request again
				logger.trace("Special case, jumping to 'SELF'");
				next_step = step;
			}
			else if(directive.goto === "NEXT") {
				next_step = _.nth(script.steps, _.indexOf(script.steps, step) + 1);
			}

			// Named target
			else {
				logger.trace("Next step will be " + directive.goto);
				next_step = _.find(script.steps, { name: directive.goto });
				if (!next_step) {
					logger.warn("Could not find next step from goto=" + directive.goto);
					var error = new error.StepNotFoundError(directive.goto);
					error.step = step;
					error.context = directive.context || context;
					throw error;
				}
			}
			return goto_next_step(next_step, directive.context || context);
		}

		function goto_next_step(next_step, context) {
			if (next_step) {
				logger.debug("Next step will be - " + (next_step.name || "#" + (_.indexOf(script.steps, next_step) + 1).toString()));
				return process_step(next_step, context);
			}
			else {
				logger.debug("Reached the end of the script.");
				logger.debug("No more steps, script completed.");
				return context; // Reached the end of the script
			}
		}

		function process_action(action, context) {
			if (_.isArray(action)) {
				// Loop through each response validation step and verify
				return Promise.mapSeries(action, single_action => process_action(single_action, context)).then(results => {
					assert(_.filter(results, !_.isNil).length == 0, "Code: PM-001 - process_action array returned values") // Should never happen
				});
			}

			logger.trace("Processing action - " + JSON.stringify(action, null, 2));
			return promise_action_execution(action, context).then(context => {
				if (action.on_success) { 
					// Abort processing of the current series of actions and start processing on_success actions
					return process_action(action.on_success, context);
				}
				return context;
			}).catch(err => {
				if(_.isString(err)) err = { message: err };
				if(!err.action) err.action = action;
				if(!err.context) err.context = context;
				if (action.on_failure) {
					logger.warn("Error during action processing: " + err + "\n  action: " + JSON.stringify(action,null,2) + "\nprocessing on_failure actions");
					context.error = err;
					context.session.error = err;
					// Abort processing of the current series of actions and start processing on_failure actions
					return process_action(action.on_failure, context).finally(() => {
						// Remove the error from the context once we've processed the on_failure
						delete context.error;
						delete context.session.error;
					});
				}
				else {
					throw err;
				}
			});
		}

		function promise_action_execution(action, context) {
			var plugin = self.plugins.findPluginForAction(action);
			if(context.options.safe && !plugin.safe) {
				throw new error.UnsafePluginError("Unsafe plugin cannot be executed in safe-mode");
			}
			if (!plugin.manual_interpolation) {
				action = context.interpolate(action, ["on_success", "on_failure"]); // Need to exclude these so we can defer the interpolation
			}
			if (plugin.process.length == 1) { // Synchronous plugin
				return Promise.try(() => {
					if (action.debugger) debugger; // for action debugging with hdb: step into the next line
					return plugin.process.call(action, context) || context;
				});
			}
			if (plugin.process.length == 2) { // Async plugin
				return new Promise((fulfill, reject) => { 
					if (action.debugger) debugger; // for action debugging with hdb: step into the next line
					plugin.process.call(action, context, (err, result) => {
						if(err) return reject(err);
						return fulfill(result || context);
					});
				})
			}
			else {
				throw new error.InvalidPluginError("Unexpected number of arguments for plugin.process() method. (Must be 1 or 2 arguments)", plugin);
			}
		}
	}
}

module.exports = Processor;
