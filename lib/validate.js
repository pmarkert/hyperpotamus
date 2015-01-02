var interpolate = require("./interpolate");
var named = require("named-regexp").named;
var async = require("async");
var _ = require("underscore");

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
	if(validation.text) {
		compare = interpolate(validation.text, session);
		value = body;
		if(value.indexOf(compare)==-1) {
			err = "Body did not match text";
		}
	}
	else if(validation.regex)  {
		compare = validation.regex;
		value = body;
		if(!regex_capturevalidate(compare, value, session)) {
			err = "Body did not match regex";
		};
	}
	else if(validation.status) {
		compare = validation.status;
		value = response.statusCode;
		if(compare !== value) {
			err = "Response status code did not match";
		}
	}
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
	}
	else {
		throw new Error("Unknown validation type - " + JSON.stringify(validation));
	}
	return callback(err, compare, value);
}

module.exports = function(step, session, response, body, done) {
	// Loop through each validation step and verify
	async.eachSeries(step.validation, function(validation, callback) {
		validate(validation, session, response, body, function(err, compare, value) {
			if(err) {
				callback({ message: err + "." + compare + " vs. " + value, jump_to_key: validation.on_failure });
			}
			else {
				callback( { message : null, jump_to_key: validation.on_success });
			}
		});
	}, function(err) {
		if(err)
			done(err.message, err.jump_to_key);
		else
			done();
	});
}
