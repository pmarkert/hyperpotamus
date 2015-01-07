var _ = require("underscore");

function extract_regex(stregex) {
	var re_match = /^\/(.+)\/([igm]*)$/.exec(stregex);
	if(re_match)
		return { pattern : re_match[1], options : re_match[2] };
	return null;
}

module.exports = function(script) {
	if(_.isObject(script) && script.normalized) return script;
	var normalized = _.isArray(script) ? script : [ script ]
	return { normalized : true, steps : _.map(normalized, normalize_step) }
}

function normalize_step(step) {
	if(!step) return null;
	if(!step.request) // If step has no .request, the step is the request
		step = { request : step };
	if(_.isString(step.request)) // If step.request is a string, then it is the url
		step.request = { url : step.request };
	if(!step.request.headers)
		step.request.headers = {};
	if(!step.response) // If no validation rules, just check for 200 status
		step.response = [ { status : 200 } ];
	if(!_.isArray(step.response)) { // Single validation -> array of one
		step.response = [ step.response ];
	}
	for(var i=0;i<step.response.length;i++) {
		if(!_.isObject(step.response[i])) { // Shortcut syntax
			if(_.isString(step.response[i])) { // String can be text or /regex/
				var re_match = extract_regex(step.response[i]);
				if(re_match)
					step.response[i] = { regex : re_match };
				else
					step.response[i] = { text : step.response[i] };
			}
			else if(_.isNumber(step.response[i])) { // Number means status code
				step.response[i] = { status : step.response[i] };
			}
		}
		else { 
			if(_.isObject(step.response[i].headers)) {
				for(var key in step.response[i].headers) {
					var re_match = extract_regex(step.response[i].headers[key]);
					step.response[i].headers[key] = re_match ? { regex : re_match } : { text : step.response[i].headers[key] }
				}
			}
			if(step.response[i].iterate) {
				// For the iterate command, on_failure is used to jump at each step
				step.response[i].on_failure = step.response[i].next;
				delete(step.response[i].next);
				if(!_.isArray(step.response[i].iterate)) {
					step.response[i].iterate = [ step.response[i].iterate ];
				}
			}
			if(step.response[i].regex && _.isString(step.response[i].regex)) {
				var re_match = extract_regex(step.response[i].regex);
				if(re_match)
					step.response[i].regex = re_match;
				else
					step.response[i].regex = { pattern : step.response[i].regex };
			}
		}
	}
	return step;
}
