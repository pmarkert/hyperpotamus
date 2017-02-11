var _ = require("lodash");
var named = require("named-regexp").named;

module.exports.extract_regex = function (stregex) {
	var re_match = /^\/(.+)\/([igm]*)$/.exec(stregex);
	if (re_match) {
		return { pattern: re_match[1], options: re_match[2] };
	}
	return null;
};

module.exports.convert_true_regex = function (regex) {
	return { pattern: regex.pattern, options: regex.options };
};

module.exports.make_regex = function (regex, context) {
	return new RegExp(context.interpolate(regex.pattern), regex.options);
};

function non_global(re, value_to_match, context) {
	var matched = re.exec(value_to_match);
	if (matched) {
		for (var key in matched.captures) {
			context.setSessionValue(key, matched.captures[key][0]);
		}
	}
	return !!matched;
}

function global(re, value_to_match, context) {
	var first = true;
	var matched;
	while ((matched = re.exec(value_to_match)) != null) {
		for (var key in matched.captures) {
			var value = matched.captures[key][0];
			if (value.length == 1) {
				value = value[0];
			}
			if (first) {
				context.setSessionValue(key, [value]);
			}
			else {
				context.getSessionValue(key).push(value);
			}
		}
		first = false;
		if (!re.global) {
			break;
		}
	}
	return !first;
}
module.exports.capture_validate = function (regex, value_to_match, context) {
	var re = named(exports.make_regex(regex, context));
	if (!re.global) {
		return non_global(re, value_to_match, context);
	}
	else {
		return global(re, value_to_match, context);
	}
};
