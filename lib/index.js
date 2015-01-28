var _ = require("underscore");
var fs = require("fs");
var yaml = require("js-yaml");

var load = require("./load");
var interpolate = require("./interpolate");
var normalize = require("./normalize");
var validate = require("./validate");
var request = require("./request");
var logger = require("log4js").getLogger("hyperpotamus.index");

function process(script, session, options) {
	// Shift parameters if needed
	if(options==null) {
		logger.trace("No options parameter passed, shifting args");
		options = session;
		session = null;
	}
	if(!options) {
		logger.debug("Options was null or empty, initializing defaults.");
		options = { };
	}
	if(_.isFunction(options)) {
		logger.debug("Options was a function, so patching function as options.done");
		options = { done : options };
	}
	if(!options.plugins) {
		logger.debug("No plugins specified, using default plugins");
		options.plugins = load.plugins.defaults(options.safe);
	}
	if(_.isUndefined(options.done) && !_.isFunction(options.done)) {
		logger.error("options.done was not a function.");
		throw new Error("if options.done is defined, then it must be a callback function. Available parameters are (err, session).");
	}
	if(!script) {
		logger.warn("Script is null or empty.");
		return options.done("Script is null", session);
	}
	if(session && !_.isObject(session)) {
		logger.error("If session is specified, it must be an object with name/value properties.");
		options.done(new Error("Session is not a valid object"), session);
	}
	var normalized = normalize(script, options.plugins);
	if(!session) {
		logger.debug("Initializing empty session.");
		session = {};
	}
	process_step(_.first(normalized.steps), normalized, session, options);
}

function process_step(step, script, session, options) {
	if(!_.isObject(step) || _.isArray(step) || _.isFunction(step)) {
		logger.error("Step must be an standard object, not an array or function.");
		throw new Error("Step was not an object");
	}
	if(step.name) {
		logger.info("Processing step - " + step.name);
	}
	else {
		logger.info("Processing step #%s", _.indexOf(script.steps, step) + 1);
	}
	logger.debug("Step is %s", JSON.stringify(step));
	request(step.request, session, options, function(err, response, buffer) {
		logger.debug("Received response");
		logger.trace("Response is %s", JSON.stringify(response));
		if(err) {
			logger.warn("Response returned with error %s", err);
			return options.done(err, session);
		}
		var context = {
			options: options,
			session: session,
			response: response,
			body: buffer.toString(),
			buffer: buffer
		};
		if(options.before_validate) { 
			logger.debug("About to invoke options.before_validate");
			options.before_validate(step, context); 
		}
		else {
			logger.trace("No options.before_validate to invoke.");
		}
		validate(step, context, function(err, jump_to_key) {
			logger.debug("Validation completed.");
			if(options.after_validate) { 
				logger.debug("About to invoke options.after_validate");
				options.after_validate(step, err, jump_to_key); 
			}
			else {
				logger.trace("No options.after_validate to invoke.");
			}
			if(err && !jump_to_key) {
				logger.warn("Error was returned and no jump_to_key specified - %s", err);
				return options.done("Validation error - " + JSON.stringify(err), session);
			}
			var next_step = null;
			if(jump_to_key) {
				logger.info("jump_to_key=" + jump_to_key);
				if(jump_to_key === "SELF" ) { // Jump to the same request again (warning, could cause indefinite loops)
					logger.debug("Special case, jumping to 'SELF'");
					next_step = step;
				}
				else if(jump_to_key !== "END") {
					logger.debug("Special case, jumping to 'END'");
					next_step = _.findWhere(script.steps, { name : jump_to_key } );
					if(!next_step) {
						logger.warn("Could not find next step from jump_to_key=" + jump_to_key);
						return options.done("Could not find step named " + jump_to_key, session);
					}
					else {
						logger.debug("Next step located");
					}
				}
			}
			else {
				logger.debug("No jump_to_key, so looking for the next step in sequence");
				var next_index = _.indexOf(script.steps, step) + 1;
				if(next_index>0 && next_index<script.steps.length) {
					logger.debug("Next step sequence is " + next_index);
					next_step = script.steps[next_index];
				}
				else {
					logger.debug("Reached the end of the script by sequence.");
				}
			}
			if(options.request_completed) {
				logger.debug("About to invoke options.request_completed");
				options.request_completed(step, next_step, script, session);
			}
			else {
				logger.trace("No options.request_completed to invoke.");
			}
			if(!next_step) {
				logger.info("No more steps, script completed.");
				return options.done(null, session); // Reached the end of the script
			}
			setImmediate(function() {
				process_step(next_step, script, session, options);
			});
		}, options.plugins);
	});
}

// Re-expose components
module.exports.interpolate = interpolate;
module.exports.normalize = normalize;
module.exports.load = load;
module.exports.processor = function(safe) {
	return { 
		plugins: load.plugins.defaults(safe),
		load: load,
		interpolate: interpolate,
		normalize: function(script) { return normalize(script, this.plugins); },
		use: function(plugins, safe) {
			if(_.isString(plugins)) {
				plugins = load.plugins.from_folder(plugins, safe);
			}
			else if(!_.isArray(plugins)) {
				plugins = [ plugins ];
			}
			for(var i=0; i<plugins.length; i++) {
				if(plugins[i].connect) 
					plugins[i].connect(this);
			}
			this.plugins = _.union(this.plugins, plugins);
		},
		process: function(script, session, options) {
			if(_.isFunction(options)) {
				options = { done: options };
			}
			var local_options = _.clone(options);
			local_options.plugins = _.union(this.plugins, options.plugins);
			process(script, session, local_options);
		}
	};
};

// Expose shortcut feature set
module.exports.yaml = {
	process_file : function (filename, session, options) {
		var script = load.scripts.yaml.file(filename, options.safe);
		process(script, session, options); 
	},
	process_text : function(script_text, session, options) {
		var script = load.scripts.yaml.text(script_text, options.safe);
		process(script, session, options); 
	}
}
