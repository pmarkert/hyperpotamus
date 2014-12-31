var _ = require("underscore");
var fs = require("fs");
var yaml = require("js-yaml");

var interpolate = require("./interpolate");
var normalize = require("./normalize");
var validate = require("./validate");
var request = require("./request");

// Used to make debug printing of regexes much simpler
// TODO - See if we can do it in a safer way so we don't pollute the prototype for global RegExp
RegExp.prototype.toJSON = RegExp.prototype.toString;

function deserialize_yaml(script_text) {
	if(!script_text || !_.isString(script_text) || !script_text.length) 
		return done("Script content is missing or unspecified", session);
	return yaml.safeLoad(script_text); // TODO - allow options for unsafe loading
}

function process_file(filename, session, done, step_callback) {
	fs.readFile(filename, "utf-8", function(err, script_text) { 
		if(err) return done(err, session); 
		process_script(script_text, session, done, step_callback); 
	});
}

function process_script(script_text, session, done, step_callback) {
	var script = deserialize_yaml(script_text);
	process(script, session, done, step_callback);
}

function process(script, session, done, step_callback) {
	if(!script) 
		return done("Script is null", session);
	var normalized = script.normalized ? script : normalize(script);
	if(!done && _.isFunction(session)) {
		step_callback = done;
		done = session;
		session = null;
	}
	if(session && !_.isObject(session)) {
		throw new Error("Session is not a valid object");
	}
	if(!session) session = {};
	process_step(_.first(normalized.steps), normalized, session, done, step_callback);
}

// TODO - Add process_url to read from a url

function process_step(step, script, session, done, step_callback) {
	if(!step) return done(null, session); // Reached the end of the script
	request(step.request, session, function(err, response, body) {
		if(err) return done(err, session);
		if(step_callback) step_callback(step, session, response, body);
		// TODO - Handle Captures
		var next_step = null;
		var jump_to_key = validate(step, session, response, body);
		if(jump_to_key) {
			if(jump_to_key !== "END") {
				next_step = _.findWhere(script.steps, { name : jump_to_key } );
				if(!next_step)
					done("Could not find request named " + jump_to_key, session);
			}
		}
		else {
			var next_index = _.indexOf(script.steps, step) + 1;
			if(next_index>0 && next_index<script.steps.length)
				next_step = script.steps[next_index];
		}
		process_step(next_step, script, session, done);
	});
}


// Re-expose components
module.exports.interpolate = interpolate;
module.exports.normalize = normalize;

// Expose main feature set
module.exports.process_file = process_file;
module.exports.process_script = process_script;
module.exports.process = process;
