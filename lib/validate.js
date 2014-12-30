var interpolate = require("./interpolate");
var named = require("named-regexp").named;
var _ = require("underscore");

function is_valid(validation, session, response, body) {
	if(validation.text) 
		return body.indexOf(interpolate(validation.text, session))>=0;
	else if(validation.regex)  {
		var matched = named(new RegExp(interpolate(validation.regex.pattern, session), validation.regex.options)).exec(body);
		if(matched) {
			for(var key in matched.captures) {
				session[key] = matched.captures[key];
				if(session[key].length==1)
					session[key] = session[key][0];
			}
		}
		return matched!=null;
	}
	else if(validation.status) 
		return response.statusCode === validation.status;
	else if(validation.equals) {
		// Array of items that after interpolation should all be equal
		if(_.isArray(validation.equals)) {
			var compare = null;
			for(var i=0; i<validation.equals.length; i++) {
				var value = interpolate(validation.equals[i], session);
				if(!compare)
					compare = value;
				else
					if(compare!==value)
						return false;
			}
			return true;
		}
		else if(_.isObject(validation.equals)) {
			var compare = null;
			for(var key in validation.equals) {
				var value = interpolate(validation.equals[key], session);
				if(!compare)
					compare = value;
				else
					if(compare!==value)
						return false;
			}
			return true;
		}
		else {
			throw new Error("Could not evaluate equals validation for non array/object type");
		}
	}
	else
		throw new Error("Unknown validation type - " + JSON.stringify(validation));
}

module.exports = function(step, session, response, body) {
	// Loop through each validation step and verify
	for(var i=0; i<step.validation.length; i++) {
		var validation = step.validation[i];
		if(!is_valid(validation, session, response, body)) {
			if(validation.on_failure) // The validation failed, but has an on_failure hook. Stop processing and jump
				return validation.on_failure;
			else
				throw new Error("Failed validation - " + JSON.stringify(validation) + ": Response was " + (body ? body : response));
		}
		if(validation.on_success) // Validation step has an on_success hook, stop processing and jump.
			return validation.on_success;
	}
}
