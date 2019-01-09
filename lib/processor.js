var _ = require("lodash");
var assert = require("assert");
var normalizer = require("./normalize");
var yaml = require("./yaml");
var Plugins = require("./plugins");
var Context = require("./context");
var Promise = require("bluebird");
var verror = require("verror");
var ProcessingDirective = require("./processingDirective");

var logger = require("./logging").logger("hyperpotamus.processor");
var defaultProcessorOptions = require("./defaultProcessorOptions");


function Processor(options) {
	var self = this;
	self.options = _.defaults({}, options, defaultProcessorOptions);
	self.plugins = new Plugins();
	self.loadFile = loadFile;
	self.loadString = loadString;
	self.normalize = normalize;
	self.process = process;
	self.processFile = processFile;

	function loadFile(scriptPath) {
		return yaml.loadFile(scriptPath, self.options.safe);
	}

	function loadString(scriptString) {
		return yaml.load(scriptString, self.options.safe);
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
		function findStep(stepName) {
			var step = _.find(script.steps, { name: stepName });
			if (!step) {
				throw new verror.VError({
					name: "StepNotFoundError",
					info: {
						step: stepName
					}
				}, "Step not found - " + stepName);
			}
			return step;
		}

		assert(!_.isNil(script), "script is null or empty");
		assert(_.isNil(session) || _.isObject(session), "If session is specified, it must be an object with name/value properties.");

		script = self.normalize(script);

		logger.debug("Initializing new session context.");
		var context = new Context(session, self, processAction, handleDirective, findStep);

		// Find the first step to process
		var step = firstStep ? { call: firstStep, path: findStep(firstStep).path } : _.first(script.steps);
		
		// And kick off the script with the first step
		return processStep(step, context);

		function processStep(step, local_context) {
			logger.debug(`Processing step - ${step.path}`);
			context.current_step = step;
			return processAction(step, local_context)
				.then(() => {
					logger.trace("Step processed successfully.");
					var current_index = _.indexOf(script.steps, step);
					var next_step = _.nth(script.steps, current_index + 1);
					return gotoNextStep(next_step, local_context);
				})
				.catch(ProcessingDirective, err => handleDirective(err, step))
				.catch(err => {
					// If it's not already an error object, let's wrap it in one
					if (!(err instanceof verror.VError)) {
						err = new verror.VError({
							name: "StepProcessingError",
							cause: err,
							info: _.defaults(verror.info(err), {
								step,
								path: step.path
							})
						}, "Unexpected error occurred during step processing");
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
				next_step = findStep(directive.goto, false);
			}
			return gotoNextStep(next_step, directive.context || context);
		}

		function gotoNextStep(next_step, local_context) {
			if (next_step) {
				logger.trace("Next step will be - " + (next_step.name || next_step.path));
				return processStep(next_step, local_context);
			}
			else {
				logger.trace("Reached the end of the script.");
				return local_context; // Reached the end of the script
			}
		}

		function processAction(action, local_context) {
			if (_.isArray(action)) {
				// Loop through each response validation step and verify
				return Promise.mapSeries(action, single_action => processAction(single_action, local_context))
					.then(results => {
						assert(_.filter(results, !_.isNil).length == 0, "Code: PM-001 - processAction array returned values"); // Should never happen
					});
			}

			logger.debug(`Processing action - ${action.path}`);
			logger.trace("Processing action - \n" + yaml.dump(action, { noRefs: true }));
			return promiseActionExecution(action, local_context)
				.delay(0) // Needed to allow SIG-INT break-ins during tight-loop scripts
				.then(local_context => {
					if (action.on_success) {
						// Abort processing of the current series of actions and start processing on_success actions
						return processAction(action.on_success, local_context);
					}
					return local_context;
				})
				.catch(err => !(err instanceof ProcessingDirective), err => {
					// Action-processing error
					if (action.on_failure) {
						logger.info(`Handling error: now processing on_failure actions.\n Action: ${yaml.dump(action, { noRefs: true })}\n Error: ${err}`);
						local_context.error = err;
						local_context.session.error = err;
						// Abort processing of the current series of actions and start processing on_failure actions
						return processAction(action.on_failure, local_context).finally(() => {
							// Remove the error from the local_context once we've processed the on_failure
							delete local_context.error;
							delete local_context.session.error;
						});
					}
					else {
						if (_.has(err, "goto")) {
							throw new ProcessingDirective({ goto: err.goto, local_context });
						}
						else {
							throw new verror.VError({
								name: "ActionProcessingError",
								cause: err,
								info: _.defaults(verror.info(err), {
									action,
									path: action.path,
									session: _.omit(local_context.session, [ "hyperpotamus" ])
								})
							}, "error processing action");
						}
					}
				});
		}

		function promiseActionExecution(action, local_context) {
			try {
				var plugin = self.plugins.findPluginForAction(action);
				if (local_context.options.safe && !plugin.safe) {
					throw new verror.VError({
						name: "UnsafePluginError",
						info: {
							action: action,
							path: action.path,
							plugin: plugin.name
						}
					}, "Unsafe plugin cannot be executed in safe-mode");
				}
				if (plugin.manual_interpolation != true) {
					action = local_context.interpolate(action, _.union(["on_success", "on_failure"], _.castArray(plugin.manual_interpolation || []))); // Need to exclude these so we can defer the interpolation
				}
				if (plugin.process.length <= 1) { // Synchronous plugin
					return Promise.try(() => {
						if (action.debugger) {
							// eslint-disable-next-line no-debugger
							debugger;
						}
						// Dear user: for debugging actions with hdb, step into the next line
						return plugin.process.call(action, local_context) || local_context;
					});
				}
				if (plugin.process.length == 2) { // Async plugin
					return new Promise((fulfill, reject) => {
						if (action.debugger) {
							// eslint-disable-next-line no-debugger
							debugger;
						}
						// Dear user: for debugging actions with hdb, step into the next line
						plugin.process.call(action, local_context, (err, result) => {
							if (err) {
								return reject(err);
							}
							return fulfill(result || local_context);
						});
					});
				}
				else {
					throw new verror.VError({
						name: "InvalidPluginError",
						info: {
							plugin: plugin.name,
							path: action.path
						}
					}, "Unexpected number of arguments for plugin.process() method. (Must be 1 or 2 arguments)");
				}
			}
			catch (err) {
				throw new verror.VError({
					name: "ActionProcessingError",
					cause: err,
					info: _.defaults(verror.info(err), {
						action: action,
						path: action.path
					})
				}, "unexpected error occurred during action processing");
			}
		}
	}
}

module.exports = Processor;
