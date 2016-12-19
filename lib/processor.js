var _ = require("lodash");
var assert = require("assert");
var normalizer = require("./normalize");
var yaml = require("./yaml");
var path = require("path");
var Plugins = require("./plugins");
var Context = require("./context");
var Promise = require("bluebird");
var StepNotFoundError = require("./error/StepNotFoundError");

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
		var context = new Context(session, self, process_action);

		// Find the first step to process
		var step = first_step ? _.find(script.steps, { name: first_step }) : _.first(script.steps);
		if (!step) {
			throw new StepNotFoundError(first_step || "#1");
		}
		// And kick off the script with the first step
		return process_step(step, script, context);
	}

	function process_step(step, script, context) {
		logger.debug("Processing step - " + (step.name || "#" + (_.indexOf(script.steps, step) + 1).toString()));
		logger.trace("Step is " + JSON.stringify(step));
		return process_action(step.actions, context).then(() => {
			logger.debug("Step processed successfully.");
			var next_index = _.indexOf(script.steps, step) + 1;
			var next_step = _.nth(script.steps, next_index);
			return goto_next_step(next_step, script, context);
		}).catch(e => _.has(e, "goto"), directive => 
			handle_goto(directive, step, script, context)
		).catch(err => {
			err.step = step;
			logger.warn("Error during action processing: " + err);
			throw err; 
		});
	}

	function handle_goto(directive, step, script, context) {
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
			logger.trace("Next step is " + directive.goto);
			next_step = _.find(script.steps, { name: directive.goto });
			if (!next_step) {
				logger.warn("Could not find next step from goto=" + directive.goto);
				var error = new StepNotFoundError(directive.goto); // , step: err.goto }, context); TODO
				error.step = step;
				error.context = context;
				throw error;
			}
		}
		return goto_next_step(next_step, script, context);
	}

	function goto_next_step(next_step, script, context) {
		if (next_step) {
			logger.debug("Next step is - " + (next_step.name || "#" + (_.indexOf(script.steps, next_step) + 1).toString()));
			return process_step(next_step, script, context);
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
			return Promise.all(action.map(single_action => process_action(single_action, context))).then(results => {
				assert(_.filter(results, !_.isNil).length == 0, "Promise.all returned values in process_action") // Should never happen
			});
		}

		logger.trace("Processing action - " + JSON.stringify(action, null, 2));
		return promise_action_execution(action, context).then(directive => {
			if(_.isString(directive)) directive = { message: directive };
			if(directive) throw directive; // Important to throw directives so we interrupt any processing

			if (action.on_success) { 
				// Abort processing of the current series of actions and start processing on_success actions
				return process_action(action.on_success, context);
			}
		}).catch(err => {
			err.action = action;
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
			throw new Error("Unsafe plugin cannot be executed in safe-mode");
		}
		if (!plugin.manual_interpolation) {
			action = context.interpolate(action, ["on_success", "on_failure"]); // Need to exclude these so we can defer the interpolation
		}
		if (plugin.process.length == 1) { // Synchronous plugin
			return Promise.try(() => {
				if (action.debugger) debugger; // for action debugging with hdb: step into the next line
				return plugin.process.call(action, context);
			});
		}
		if (plugin.process.length == 2) { // Async plugin
			return new Promise((fulfill, reject) => { 
				if (action.debugger) debugger; // for action debugging with hdb: step into the next line
				plugin.process.call(action, context, (err, result) => {
					if(err) return reject(err);
					return fulfill(result);
				});
			})
		}
		else {
			throw new Error("Unexpected number of arguments for plugins process() method."); //, plugin: plugin.name);
		}
	}
}

module.exports = Processor;
