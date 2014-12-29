var interpolate = require("./interpolate");

function is_valid(validation, session, response, body) {
	if(validation.text) 
		return body.indexOf(interpolate(validation.text, session))>=0;
	if(validation.regex)  {
		return new RegExp(interpolate(validation.regex.pattern, session), validation.regex.options).test(body);
	}
	if(validation.status) 
		return response.statusCode === validation.status;
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
