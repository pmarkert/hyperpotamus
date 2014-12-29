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

function process_file(filename, session, done, step_callback) {
	fs.readFile(filename, "utf-8", function(err, script_text) { 
		if(err) return done(err); 
		process_script(script_text, session, done, step_callback); 
	});
}

function process_script(script_text, session, done, step_callback) {
	if(!done && _.isFunction(session)) {
		step_callback = done;
		done = session;
		session = null;
	}
	if(session && !_.isObject(session)) {
		throw new Error("Session is not a valid object");
	}
	if(!session) session = {};
	if(!script_text || !_.isString(script_text) || !script_text.length) 
		return done("Script content is missing or unspecified");
	var script = yaml.safeLoad(script_text);
	if(!script) 
		return done("Script evaluated to null");
	if(!_.isArray(script))  // Convert special case of single step to an array of one
		script = [ script ];
	normalized = _.map(script, normalize);
	return process_step(_.first(normalized), normalized, session, done, step_callback);
}

// TODO - Add process_url to read from a url

function process_step(step, script, session, done, step_callback) {
	if(!step) return done(null, session); // Reached the end of the script
	request(step.request, session, function(err, response, body) {
		if(err) return done(err);
		if(step_callback) step_callback(step, response, body);
		// TODO - Handle Captures
		var next_step = null;
		var jump_to_key = validate(step, session, response, body);
		if(jump_to_key) {
			if(jump_to_key !== "END") {
				next_step = _.findWhere(script, { name : jump_to_key } );
				if(!next_step)
					done("Could not find request named " + jump_to_key);
			}
		}
		else {
			var next_index = _.indexOf(script, step) + 1;
			if(next_index>0 && next_index<script.length)
				next_step = script[next_index];
		}
		process_step(next_step, script, session, done);
	});
}

module.exports.process_file = process_file;
module.exports.process_script = process_script;
