var _ = require("underscore");
var fs = require("fs");
var yaml = require("js-yaml");

var load = require("./load");
var interpolate = require("./interpolate");
var normalize = require("./normalize");
var validate = require("./validate");
var request = require("./request");
var logging = require("./logging")
var logger = logging.logger("hyperpotamus.index");

function process(script, session, options) {
	if(!options) {
		logger.debug("Options was null or empty, initializing defaults.");
		options = { };
	}
	else if(_.isFunction(options)) {
		logger.debug("Options was a function, so patching function as options.done");
		options = { done : options };
	}
	if(_.isUndefined(options.done) || !_.isFunction(options.done)) {
		logger.error("options.done was not a function.");
		throw new Error("Options.done must be a callback function with parameters (err, session).");
	}
	if(!script) {
		logger.warn("Script is null or empty.");
		return options.done("Script is null", session);
	}
	if(session && !_.isObject(session)) {
		logger.error("If session is specified, it must be an object with name/value properties.");
		options.done(new Error("Session is not a valid object"), session);
	}
	script = normalize(script, options.plugins);
	if(!session) {
		logger.debug("Initializing empty session.");
		session = {};
	}
	var context = {
		options: options,
		session: session,
		interpolate: interpolate,
		validate: validate
	};
	// Now kick off the script by processing the first step
	process_step(_.first(script.steps), script, context);
}

function process_step(step, script, context) {
	if(!_.isObject(step) || _.isArray(step) || _.isFunction(step)) {
		logger.error("Step must be an standard object, not an array or function.");
		throw new Error("Step was not an object");
	}
	if(step.name) {
		logger.info("Processing step - " + step.name);
	}
	else {
		logger.info("Processing step #" + (_.indexOf(script.steps, step) + 1).toString());
	}
	logger.debug("Step is " + JSON.stringify(step));
	request(step.request, context, function(err, response, buffer) {
		context.session["hyperpotamus_request_timing"] = new Date() - context.request_started;
		delete(context.request_started);

		logger.debug("Received response");
		logger.trace("Response is " + JSON.stringify(response));
		context.response = response;
		context.buffer = buffer;
		context.body = buffer ? buffer.toString() : "";
		if(err) {
			logger.warn("Response returned with error" + err);
			return context.options.done(JSON.stringify(err, null, '  '), context);
		}
		if(context.options.before_validate) { 
			logger.debug("About to invoke options.before_validate");
			context.options.before_validate(step, context); 
		}
		else {
			logger.trace("No options.before_validate to invoke.");
		}
		try {
			validate.process_actions(step.actions, context, function(err) {
				logger.debug("Validation completed.");
				if(context.options.after_validate) { 
					logger.debug("About to invoke options.after_validate");
					context.options.after_validate(step, err, err.jump_to_key); 
				}
				else {
					logger.trace("No options.after_validate to invoke.");
				}
				if(err && !err.jump_to_key) {
					err.step = step;
					err.response = response;
					err.session = context.session;
					logger.warn("Error was returned and no jump_to_key specified: " + JSON.stringify(err));
					return context.options.done("Validation error - " + JSON.stringify(err, null, '  '), context);
				}
				var next_step = null;
				if(err && err.jump_to_key && err.jump_to_key !== "NEXT") {
					logger.info("jump_to_key=" + err.jump_to_key);
					if(err.jump_to_key === "SELF" ) { // Jump to the same request again (warning, could cause indefinite loops)
						logger.debug("Special case, jumping to 'SELF'");
						next_step = step;
					}
					else if(err.jump_to_key !== "END") {
						logger.debug("jump_to_key specified, jumping to '" + err.jump_to_key + "'");
						next_step = _.findWhere(script.steps, { name : err.jump_to_key } );
						if(!next_step) {
							err.step = step;
							err.response = response;
							err.session = context.session;
							logger.warn("Could not find next step from jump_to_key=" + err.jump_to_key);
							return context.options.done("Could not find step named " + err.jump_to_key, context);
						}
						else {
							logger.debug("Next step located");
						}
					}
				}
				else {
					if(err && err.jump_to_key === "NEXT") {
						logger.debug("Jumping to next request.");
					}
					else {
						logger.debug("No jump_to_key, so looking for the next step in sequence");
					}
					var next_index = _.indexOf(script.steps, step) + 1;
					if(next_index>0 && next_index<script.steps.length) {
						logger.debug("Next step sequence is " + next_index);
						next_step = script.steps[next_index];
					}
					else {
						logger.debug("Reached the end of the script by sequence.");
					}
				}
				if(context.options.request_completed) {
					logger.debug("About to invoke options.request_completed");
					context.options.request_completed(step, next_step, script, context);
				}
				else {
					logger.trace("No options.request_completed to invoke.");
				}
				if(!next_step) {
					logger.debug("No more steps, script completed.");
					return context.options.done(null, context); // Reached the end of the script
				}
				setImmediate(function() {
					process_step(next_step, script, context);
				});
			});
		} catch(err) {
			logger.fatal("Validation failed - " + JSON.stringify(err, null, "  "));
			throw err;
		}
	});
}

function instance(options) {
	if(_.isFunction(options)) {
		options = { safe: false, done: options };
	}
	options = options || { safe : false };
	var loader = load(options);
	options.plugins = loader.plugins;
	return { 
		options: options,
		load: loader,
		interpolate: interpolate,
		normalize: function(script) { return normalize(script, this.options.plugins); },
		process: function(script, session, callback) {
			var local_options = options;
			if(_.isFunction(callback)) {
				local_options = { done : callback };
				_.defaults(local_options, options);
			}
			process(script, session, local_options);
		}
	};
};

// Re-expose components
module.exports.interpolate = interpolate;
module.exports.processor = instance;
module.exports.logging = logging;

// Expose shortcut feature set
module.exports.yaml = {
	process_file : function (filename, session, options) {
		var processor = instance(options);
		var script = processor.load.scripts.yaml.file(filename);
		processor.process(script, session); 
	},
	process_text : function(script_text, session, options) {
		var processor = instance(options);
		var script = processor.load.scripts.yaml.text(script_text);
		processor.process(script, session); 
	}
}
