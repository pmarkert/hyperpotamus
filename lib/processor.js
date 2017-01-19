var _ = require("lodash");
var assert = require("assert");
var normalizer = require("./normalize");
var yaml = require("./yaml");
var path = require("path");
var Plugins = require("./plugins");
var Context = require("./context");
var Promise = require("bluebird");
var verror = require("verror");
var semver = require("semver");

var logger = require("./logging").logger("hyperpotamus.index");

var default_options = {
	emit: console.log, // eslint-disable-line no-console
	safe: false,
	auto_load_plugins: false,
	sessionDefaults: {},
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

	function loadFile(scriptPath) {
		var script = yaml.loadFile(scriptPath, self.options.safe);
		if (self.options.auto_load_plugins && !_.isNil(script.plugins)) {
			self.plugins.load(script.plugins, path.dirname(scriptPath));
		}
		return script;
	}

	function loadString(scriptString, basePath) {
		var script = yaml.load(scriptString, self.options.safe);
		if (self.options.auto_load_plugins && !_.isNil(script.plugins)) {
			self.plugins.load(script.plugins, basePath);
		}
		return script;
	}

	function normalize(script) {
		return normalizer(script, self.plugins);
	}

	function processFile(scriptPath, session, firstStep) {
		var script = loadFile(scriptPath);
		return process(script, session, firstStep);
	}

	// TODO - Refactoring needed
	// Eliminate the closure by encapsulating into the class state. I've intentionally tried to keep the 
	// processor as a reusable object that can process multiple script instances (for plugin loading, options, 
	// etc.) but that might be causing more trouble than it solves.
	function process(script, session, firstStep) {
		assert(!_.isNil(script), "script is null or empty");
		assert(_.isNil(session) || _.isObject(session), "If session is specified, it must be an object with name/value properties.");

		script = self.normalize(script);

		if (script.version) {
			var hyperpotamus_version = require("../package.json").version;
			if (!semver.satisfies(hyperpotamus_version, script.version)) {
				return Promise.reject(new verror.VError({ 
					name: "VersionMismatchError", 
					info: { 
						current_version: hyperpotamus_version, 
						required_version: script.version 
					} 
				}));
			}
		}

		logger.debug("Initializing new session context.");
		var context = new Context(session, self, processAction, handleDirective);

		// Find the first step to process
		var step = firstStep ? _.find(script.steps, { name: firstStep }) : _.first(script.steps);
		if (!step) {
			throw new verror.VError({ 
				name: "StepNotFoundError", 
				info: { 
					goto: firstStep || "#1"
				} 
			});
		}
		// And kick off the script with the first step
		return processStep(step, context);

		function processStep(step, context) {
			logger.debug(`Processing step - ${step.path}`);
			logger.trace(`Step is \n${yaml.dump(step, { noRefs: true })}`);
			context.current_step = step;
			return processAction(step.actions, context).then(() => {
				logger.debug("Step processed successfully.");
				var next_index = _.indexOf(script.steps, step) + 1;
				var next_step = _.nth(script.steps, next_index);
				return gotoNextStep(next_step, context);
			}).catch(err => {
				if (verror.hasCauseWithName(err, "JumpResult")) {
					return handleDirective(verror.info(err), step);
				}
				// If it's not already an error object, let's wrap it in one
				if (!(err instanceof verror.VError)) {
					err = new verror.VError({ 
						name: "StepProcessingError", 
						cause: err 
					});
				}
				err.jse_info.step = step;
				throw err;
			});
		}

		function handleDirective(directive, step) {
			var next_step;
			logger.debug("Action processing completed with goto directive for - " + directive.goto);

			// Special targets
			if (directive.goto === "END") {
				next_step = null;
			}
			else if (directive.goto === "SELF") { // Jump to the same request again
				logger.trace("Special case, jumping to 'SELF'");
				next_step = step;
			}
			else if (directive.goto === "NEXT") {
				next_step = _.nth(script.steps, _.indexOf(script.steps, step) + 1);
			}

			// Named target
			else {
				logger.trace("Next step will be " + directive.goto);
				next_step = _.find(script.steps, { name: directive.goto });
				if (!next_step) {
					logger.warn("Could not find next step from goto=" + directive.goto);
					var err = new verror.VError({ 
						name: "StepNotFoundError", 
						info: { 
							goto: directive.goto, 
							step: step 
						} 
					});
					err.step = step;
					err.context = directive.context || context;
					throw err;
				}
			}
			return gotoNextStep(next_step, directive.context || context);
		}

		function gotoNextStep(next_step, context) {
			if (next_step) {
				logger.debug("Next step will be - " + (next_step.name || next_step.path));
				return processStep(next_step, context);
			}
			else {
				logger.debug("Reached the end of the script.");
				logger.debug("No more steps, script completed.");
				return context; // Reached the end of the script
			}
		}

		function processAction(action, context) {
			if (_.isArray(action)) {
				// Loop through each response validation step and verify
				return Promise.mapSeries(action, single_action => processAction(single_action, context)).then(results => {
					assert(_.filter(results, !_.isNil).length == 0, "Code: PM-001 - processAction array returned values"); // Should never happen
				});
			}

			logger.trace("Processing action - " + yaml.dump(action, { noRefs: true }));
			return promiseActionExecution(action, context).then(context => {
				if (action.on_success) {
					// Abort processing of the current series of actions and start processing on_success actions
					return processAction(action.on_success, context);
				}
				return context;
			}).catch(err => {
				// Action-processing error
				if (action.on_failure) {
					logger.info(`Handling error: now processing on_failure actions.\n Action: ${yaml.dump(action, { noRefs: true })}\n Error: ${err}`);
					context.error = err;
					context.session.error = err;
					// Abort processing of the current series of actions and start processing on_failure actions
					return processAction(action.on_failure, context).finally(() => {
						// Remove the error from the context once we've processed the on_failure
						delete context.error;
						delete context.session.error;
					});
				}
				else {
					var throwable;
					if (_.has(err, "goto")) {
						throwable = new verror.VError({ 
							name: "JumpResult", 
							info: { 
								goto: err.goto, 
								context 
							} 
						});
					}
					else {
						if (_.isError(err)) {
							throwable = new verror.WError({ 
								name: "ActionProcessingError", 
								cause: err, 
								info: { 
									action, 
									session: context.session
								} 
							}, "Error processing action - %s", action.path);
						}
						else {
							throwable = new verror.VError({ 
								name: "ActionProcessingError", 	
								info: { 	
									action, 	
									session: context.session, 	
									err 	
								} 	
							}, `Error processing action - ${err}`);
						}
					}
					throw throwable;
				}
			});
		}

		function promiseActionExecution(action, context) {
			try {
				var plugin = self.plugins.findPluginForAction(action);
				if (context.options.safe && !plugin.safe) {
					throw new verror.VError({ 	
						name: "UnsafePluginError", 	
						info: { 	
							action: action, 	
							plugin: plugin.name 	
						} 	
					}, "Unsafe plugin cannot be executed in safe-mode");
				}
				if (plugin.manual_interpolation != true) {
					action = context.interpolate(action, _.union(["on_success", "on_failure"], _.castArray(plugin.manual_interpolation || []))); // Need to exclude these so we can defer the interpolation
				}
				if (plugin.process.length == 1) { // Synchronous plugin
					return Promise.try(() => {
						if (action.debugger) {
							debugger; // eslint-disable-line no-debugger
						} 
						// Dear user: for debugging actions with hdb, step into the next line
						return plugin.process.call(action, context) || context;
					});
				}
				if (plugin.process.length == 2) { // Async plugin
					return new Promise((fulfill, reject) => {
						if (action.debugger) {
							debugger; // eslint-disable-line no-debugger
						} 
						// Dear user: for debugging actions with hdb, step into the next line
						plugin.process.call(action, context, (err, result) => {
							if (err) {
								return reject(err);
							}
							return fulfill(result || context);
						});
					});
				}
				else {
					throw new verror.VError({ 	
						name: "InvalidPluginError", 	
						info: { 	
							plugin: plugin.name 	
						} 	
					}, "Unexpected number of arguments for plugin.process() method. (Must be 1 or 2 arguments)");
				}
			}
			catch (err) {
				var toThrow = err;
				if (!(err instanceof verror.VError)) {
					toThrow = new verror.WError({
						name: "ActionProcessingError",
						cause: err,
					}, "Unexpected error occurred during action processing");
				}
				toThrow.jse_info.action = action;
				throw toThrow;
			}
		}
	}
}

module.exports = Processor;
