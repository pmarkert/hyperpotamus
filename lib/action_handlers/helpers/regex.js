var interpolate = require("../../interpolate");
var named = require("named-regexp").named;

module.exports.extract_regex = function(stregex) {
        var re_match = /^\/(.+)\/([igm]*)$/.exec(stregex);
        if(re_match)
                return { pattern : re_match[1], options : re_match[2] };
        return null;
}

module.exports.convert_true_regex = function(regex) {
	var re = { pattern : validation.source, options : "" };
	if(validation.global) re.options += "g";
	if(validation.ignoreCase) re.options += "i";
	if(validation.multiline) re.options += "m";
	return re;
}

module.exports.capture_validate = function(regex, value_to_match, session) {
	var matched = named(new RegExp(interpolate(regex.pattern, session), regex.options)).exec(value_to_match);
	if(matched) {
		for(var key in matched.captures) {
			session[key] = matched.captures[key];
			if(session[key].length==1) {
				session[key] = session[key][0];
			}
		}
	}
	return matched;
}
