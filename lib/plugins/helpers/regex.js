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

module.exports.make_regex = function(regex, session) {
	return new RegExp(interpolate(regex.pattern, session), regex.options);
}

module.exports.capture_validate = function(regex, value_to_match, session) {
	var matched;
	var re = named(module.exports.make_regex(regex, session));
	if(!re.global) {
		matched = re.exec(value_to_match);
		if(matched) {
			for(var key in matched.captures) {
				session[key] = matched.captures[key][0];
			}
		}
		return !!matched;
	}
	else {
		var first = true;
		while((matched = re.exec(value_to_match)) != null) {
			for(var key in matched.captures) {
				var value = matched.captures[key][0];
				if(value.length==1) value = value[0];
				if(first) {
					session[key] = [ value ];
				}
				else {
					session[key].push(value);
				}
			}
			first = false;
			if(!re.global) break;
		}
		return !first;
	}
}
