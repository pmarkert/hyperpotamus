var _ = require("underscore");

function extract_regex(stregex) {
	var re_match = /^\/(.+)\/([igm]*)$/.exec(stregex);
	if(re_match)
		return { pattern : re_match[1], options : re_match[2] };
	return null;
}

module.exports = function(step) {
	if(!step) return null;
	if(!step.request) // If step has no .request, the step is the request
		step = { request : step };
	if(_.isString(step.request)) // If step.request is a string, then it is the url
		step.request = { url : step.request };
	if(!step.request.headers)
		step.request.headers = {};
	if(!step.validation) // If no validation rules, just check for 200 status
		step.validation = [ { status : 200 } ];
	if(!_.isArray(step.validation)) { // Single validation -> array of one
		step.validation = [ step.validation ];
	}
	for(var i=0;i<step.validation.length;i++) {
		if(!_.isObject(step.validation[i])) { // Shortcut syntax
			if(_.isString(step.validation[i])) { // String can be text or /regex/
				var re_match = extract_regex(step.validation[i]);
				if(re_match)
					step.validation[i] = { regex : re_match };
				else
					step.validation[i] = { text : step.validation[i] };
			}
			else if(_.isNumber(step.validation[i])) { // Number means status code
				step.validation[i] = { status : step.validation[i] };
			}
		}
		else { 
			if(step.validation[i].regex && _.isString(step.validation[i].regex)) {
				var re_match = extract_regex(step.validation[i].regex);
				if(re_match)
					step.validation[i].regex = re_match;
				else
					step.validation[i].regex = { pattern : step.validation[i].regex };
			}
		}
	}
	return step;
}
