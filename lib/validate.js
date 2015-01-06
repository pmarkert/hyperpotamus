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

function validate(validation, session, response, body, callback) {
	var err, compare, value;
	if(_.isFunction(validation)) {
		validation(response, body, session, function(err) {
			if(err) return callback(err, response, "Custom function");
			return callback();
		});
	}
	else if(validation.text) {
		compare = interpolate(validation.text, session);
		value = body;
		if(value.indexOf(compare)==-1) {
			err = "Body did not match text";
		}
		return callback(err, compare, value);
	}
	else if(_.isRegExp(validation)) {
		var re = { pattern : validation.source, options : "" };
		if(validation.global) re.options += "g";
		if(validation.ignoreCase) re.options += "i";
		if(validation.multiline) re.options += "m";
		compare = re;
		value = body;
		if(!regex_capturevalidate(compare, value, session)) {
			err = "Body did not match regex";
		};
		return callback(err, compare, value);
	}
	else if(validation.regex)  {
		compare = validation.regex;
		value = body;
		if(!regex_capturevalidate(compare, value, session)) {
			err = "Body did not match regex";
		};
		return callback(err, compare, value);
	}
	else if(validation.status) {
		compare = validation.status;
		value = response.statusCode;
		if(compare !== value) {
			err = "Response status code did not match";
		}
		return callback(err, compare, value);
	}
	// TODO - add not: to negate a validation
	// TODO - add validation.set to explictly set values
	else if(validation.equals) {
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
	else if(validation.headers) {
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
	else if(validation.jquery) {
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
	else {
		throw new Error("Unknown validation type - " + JSON.stringify(validation));
        }
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
