var _ = require("underscore");
var fs = require("fs");
var yaml = require("js-yaml");

var load = require("./load");
var interpolate = require("./interpolate");
var normalize = require("./normalize");
var validate = require("./validate");
var request = require("./request");

function process(script, session, done, step_callback) {
	if(!script) return done("Script is null", session);
	var normalized = normalize(script);
	// Shift parameters if needed
	if(!done && _.isFunction(session)) {
		step_callback = done;
		done = session;
		session = null;
	}
	if(session && !_.isObject(session)) {
		done(new Error("Session is not a valid object"), session);
	}
	if(!session) session = {};
	process_step(_.first(normalized.steps), normalized, session, done, step_callback);
}

function process_step(step, script, session, done, step_callback) {
	request(step.request, session, function(err, response, body) {
		if(err) return done(err, session);
		validate(step, session, response, body, function(err, jump_to_key) {
			if(err && !jump_to_key) {
				return done("Validation error - " + JSON.stringify(err), session);
			}
			var next_step = null;
			if(jump_to_key) {
				if(jump_to_key !== "END") {
					next_step = _.findWhere(script.steps, { name : jump_to_key } );
					if(!next_step) return done("Could not find request named " + jump_to_key, session);
				}
			}
			else {
				var next_index = _.indexOf(script.steps, step) + 1;
				if(next_index>0 && next_index<script.steps.length)
					next_step = script.steps[next_index];
			}
			if(step_callback) step_callback(step, session, response, body);
			if(!next_step) return done(null, session); // Reached the end of the script
			process_step(next_step, script, session, done);
		});
	});
}

// Re-expose components
module.exports.interpolate = interpolate;
module.exports.normalize = normalize;
module.exports.load = load;
module.exports.process = process;

// Expose shortcut feature set
module.exports.yaml = {
	process_file : function (filename, session, done, step_callback) {
		load.yaml.file(filename, function(err, script) {
			if(err) return done(err, session); 
			process(script, session, done, step_callback); 
		});
	},
	process_text : function(script_text, session, done, step_callback) {
		var script = load.yaml.text(script_text);
		process(script, session, done, step_callback); 
	}
}
