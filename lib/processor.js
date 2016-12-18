var _ = require("lodash");
var assert = require("assert");
var async = require("async");
var normalizer = require("./normalize");
var yaml = require("./yaml");
var path = require("path");
var Plugins = require("./plugins");
var Context = require("./context");
var Promise = require("bluebird");

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
			return Promise.reject(new Error("Could not find starting_step - " + (first_step || "#1"))); // TODO - return context too
		}
		// And kick off the script with the first step
		return process_step(step, script, context);
	}

	function process_step(step, script, context) {
		logger.debug("Processing step - " + (step.name || "#" + (_.indexOf(script.steps, step) + 1).toString()));
		logger.trace("Step is " + JSON.stringify(step));
// 		TODO if(self.after_validate) { promise = promise.tap(self.after_validate); } */
		return process_action(step.actions, context).then(() => {
			logger.debug("Action completed without error.");
				var next_index = _.indexOf(script.steps, step) + 1;
				var next_step = _.nth(script.steps, next_index);
				if (next_step) {
					logger.trace("Next step index is #" + next_index);
					return process_step(next_step, script, context);
				}
				else {
					logger.debug("Reached the end of the script.");
					logger.debug("No more steps, script completed.");
					return Promise.resolve(context); // Reached the end of the script
				}
		}).catch(err => {
			if (err.goto) {
				logger.debug("Action processing completed with .goto=" + err.goto);
				if (err.goto === "SELF") { // Jump to the same request again (warning, could cause indefinite loops)
					logger.trace("Special case, jumping to 'SELF'");
					next_step = step;
				}
				else {
					logger.debug("goto specified, jumping to '" + err.goto + "'");
					if (err.goto == "END") {
						return Promise.resolve(context);
					}
					next_step = _.find(script.steps, { name: err.goto });
					if (next_step) {
						logger.trace("Next step is " + err.goto);
						return process_step(next_step, script, context);
					}
					else {
						err.step = step;
						err.session = context.session;
						logger.warn("Could not find next step from goto=" + err.goto);
						return Promise.reject(new Error("Could not find step"), err); // , step: err.goto }, context); TODO
					}
				}
			}
			else {
				err.step = step;
				err.session = context.session;
				logger.warn("Error was returned and no .goto specified: " + err);
				return Promise.reject(new Error("Validation error", err)); //, error: err }, context); // TODO
			}
		});
	}

	function process_action(action, context) {
		if (_.isArray(action)) {
			// Loop through each response validation step and verify
			return Promise.all(action.map(single_action => process_action(single_action, context)));
		}

		return promise_action_execution(action, context).then(() => {
			if (action.on_success) { // Jump
				// Abort processing of the current series of actions and start processing on_success actions
				return process_action(action.on_success, context);
			}
			else { // Continue
				return Promise.resolve();
			}
		}).catch(err => {
			if (_.isString(err)) {
				err = new Error(err);
			}
			if (action.on_failure) {
				context.error = err;
				context.session.error = err;
				// Abort processing of the current series of actions and start processing on_failure actions
				return process_action(action.on_failure, context).finally(() => {
					delete context.error;
					delete context.session.error;
				});
			}
			else {
				return Promise.reject(err);
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
		// HDB: action debugging - step into the next line
		// TODO - debugger isn't going to catch a useful spot
		if (action.debugger) {
			debugger;
		}
		if (plugin.process.length == 1) { // Synchronous plugin
			return new Promise((fulfill, reject) => {
				var result = plugin.process.call(action, context);
				if(!result || result.then) fulfill(result);
				else reject(result); 
			});
		}
		if (plugin.process.length == 2) { // Async plugin
			return Promise.promisify(plugin.process.bind(action))(context)
		}
		else {
			throw new Error("Unexpected number of arguments for plugins process() method."); //, plugin: plugin.name);
		}
	}
}

module.exports = Processor;
