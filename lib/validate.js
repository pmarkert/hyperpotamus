var interpolate = require("./interpolate");
var named = require("named-regexp").named;
var async = require("async");
var _ = require("underscore");
var jquery = require("jquery");
var jsdom = require("jsdom");

function regex_capturevalidate(regex, value_to_match, session) {
	var matched = named(new RegExp(interpolate(regex.pattern, session), regex.options)).exec(value_to_match);
	if(matched) {
		for(var key in matched.captures) {
			session[key] = matched.captures[key];
			if(session[key].length==1) {
				session[key] = session[key][0];
			}
		}
	}
	return matched!=null;
}

function validate_custom_function(validation, session, response, body, callback) {
	validation(response, body, session, function(err) {
		if(err) return callback(err, response, "Custom function");
		return callback();
	});
}

function validate_text(validation, session, response, body, callback) {
	var err;
	var compare = interpolate(validation.text, session);
	if(body.indexOf(compare)==-1) {
		err = "Body did not match text";
	}
	return callback(err, compare, body);
}

function validate_regexp(validation, session, response, body, callback) {
	var err;
	if(!regex_capturevalidate(validation.regex, body, session)) {
		err = "Body did not match regex";
	};
	return callback(err, validation.regex, body);
}

function validate_true_regexp(validation, session, response, body, callback) {
	var err;
	var re = { pattern : validation.source, options : "" };
	if(validation.global) re.options += "g";
	if(validation.ignoreCase) re.options += "i";
	if(validation.multiline) re.options += "m";
	if(!regex_capturevalidate(re, body, session)) {
		err = "Body did not match regex";
	};
	return callback(err, re, body);
}

function validate_status(validation, session, response, body, callback) {
	var err;
	if(validation.status !== response.statusCode) {
		err = "Response status code did not match";
	}
	return callback(err, validation.status, response.statusCode);
}

function validate_equals(validation, session, response, body, callback) {
	var err, compare, value;
	// Array of items that after interpolation should all be equal
	if(_.isArray(validation.equals)) {
		for(var i=0; i<validation.equals.length; i++) {
			value = interpolate(validation.equals[i], session);
			if(!compare) {
				compare = value;
			}
			else {
				if(compare!==value) {
					err = "Element at position " + i + " did not match comparison value";
					break;
				}
			}
		}
	}
	else if(_.isObject(validation.equals)) {
		for(var key in validation.equals) {
			value = interpolate(validation.equals[key], session);
			if(!compare) {
				compare = value;
			}
			else {
				if(compare!==value) {
					err = "Comparison property " + key + " did not match commparison value";
					break;
				}
			}
		}
	}
	else {
		throw new Error("Could not evaluate equals validation for non array/object type");
	}
	return callback(err, compare, value);
}


function validate_headers(validation, session, response, body, callback) {
	var err, value;
	for(var key in validation.headers) {
		if(key == "on_success" || key == "on_failure") continue;
		value = response.headers[key];
		if(validation.headers[key].text) {
			compare = interpolate(validation.headers[key].text);
			if(compare !== value) {
				err = "Header " + key + " did not match text value";
				break;
			}
		}
		if(validation.headers[key].regex) {
			compare = validation.headers[key].regex;
			if(!regex_capturevalidate(validation.headers[key].regex, value, session)) {
				err = "Header " + key + " did not match regex value";
				break;
			}
		}
	}
	return callback(err, compare, value);
}

function validate_jquery(validation, session, response, body, callback) {
	var err, compare, value;
	jsdom.env(body, function(err, window) {
		if(err) {
			return callback("Error parsing document - " + err, body, null);
		}
		var $ = jquery(window);
		var key = validation.key;
		var matches = $(validation.jquery);
		if(validation.count) {
			if(_.isNumber(validation.count)) {
				compare = validation.count;
			}
			else { // Assume _.isString for now. TODO - Error otherwise
				compare = parseInt(interpolate(validation.count, session));
			}
			if(matches.length!==compare) {
				return callback("Expected count of matches did not match", compare, matches.length);
			}
		}
		if(validation.capture) {
			async.eachSeries(matches, function(element, cb) {
				element = $(element);
				for(var key in validation.capture) {
					var target = validation.capture[key];
					var isArray = false;
					if(_.isArray(validation.capture[key])) {
						isArray = true;
						target = target[0];
						// TODO - handling for array lengths!=1
					}
					if(!target || target==="html" || target==="outerHTML") value = element[0].outerHTML;
					else if(target==="innerHTML") value = $(element).html();
					else if(target==="text") value = $(element).text();
					else if(target[0]==="@") value = $(element).attr(target.substring(1));
					if(isArray) {
						if(!_.isArray(session[key])) {
							session[key] = [];
						}
						session[key].push(value);
					}
					else {
						session[key] = value;
					}
				}
				cb();
			}, function(err) {
				return callback(err, compare, value);
			});
		}
	});
}

function process_iteration(validation, session, response, body, callback) {
	var reached_end = false;
	for(var i=0; i<validation.iterate.length; i++) { // Increment the .index for each array in the array of [iterate]
		if(!_.isArray(session[validation.iterate[i]])) { // If it's not an array, pretend it's an array of one (and jump right away)
			reached_end = true;
		}
		else {
			if(!session[validation.iterate[i] + ".index"] ) { // This is the first time, so the index was 0 before incrementing
				session[validation.iterate[i] + ".index"] = 0;
			}
			if(session[validation.iterate[i] + ".index"] < session[validation.iterate[i]].length - 1) { // If we still have elements
				session[validation.iterate[i] + ".index"]++;
			}
			else { // We reached the end
				delete(session[validation.iterate[i]+".index"]);
				reached_end = true;
			}
		}
	}
	// We return an error to cause a to jump_to_key(on_failure). If we reached the end, return success (complete) to move on
	if(reached_end) { return callback(); }
	else { return callback("Iteration"); }
}

function validate(validation, session, response, body, callback) {
	var handler;

	// TODO - add not: to negate a validation
	// TODO - add validation.set to explictly set values
	if(_.isFunction(validation)) handler = validate_custom_function;
	else if(validation.text) handler = validate_text;
	else if(_.isRegExp(validation)) handler = validate_true_regexp;
	else if(validation.regex) handler = validate_regexp;
	else if(validation.status) handler = validate_status;
	else if(validation.equals) handler = validate_equals;
	else if(validation.headers) handler = validate_headers;
	else if(validation.jquery) handler = validate_jquery;
	else if(validation.iterate) handler = process_iteration;
	else throw new Error("Unknown validation type - " + JSON.stringify(validation));
	handler(validation, session, response, body, callback);
}

module.exports = function(step, session, response, body, done) {
	// Loop through each validation step and verify
	async.eachSeries(step.response, function(validation, callback) {
		validate(validation, session, response, body, function(err, compare, value) {
			if(err) {
				return callback({ message: err + "." + compare + " vs. " + value, jump_to_key: validation.on_failure });
			}
			else {
				if(validation.on_success) {
					return callback( { message : null, jump_to_key: validation.on_success });
				}
				else {
					return callback();
				}
			}
		});
	}, function(err) {
		if(err)
			return done(err.message, err.jump_to_key);
		else
			return done();
	});
}
