var _ = require("underscore");
var pipes = require("./pipes");

/* Unfortunately, Mark has to be global because of the way they add in extras */
Mark = require("markup-js");
require("markup-js/src/extras/arrays");
require("markup-js/src/extras/dates");
require("markup-js/src/extras/i18n");
require("markup-js/src/extras/numbers");
require("markup-js/src/extras/strings");

var options = { 
	delimiter : ",",
	pipes : pipes,
	start_delimiter : "<%",
	end_delimiter : "%>",
	undefinedResult : function(tag, context, child, filters, markup) {
		// Check for null token (useful for just invoking filters)
		var token = tag.split("|")[0].trim();
		if(token === markup.start_delimiter) {
			return markup._pipe("", filters);
		}

		// Otherwise, if the value was null, check to see if the first (psuedo)filter is 'optional'
		var filter = filters.shift();
		if(filter) {
			var parts = filter.split(markup.delimiter);
			if(parts[0].trim() == "optional") { // First parameter is the default value
				return markup._pipe((parts[1] || "").trim(), filters);
			}
		}
		throw new Error("No value found for non-optional replacement - key:" + tag);
	},
	pipelineError : function(err) {
		throw err;
	}
}

module.exports = function(object, data) {
	function interpolate_tree(object) {
		if(_.isString(object)) {
			return Mark.up(object, data, options);
		}
		if(_.isArray(object)) {
			return _.map(object, interpolate_tree);
		}
		if(_.isObject(object) && !_.isRegExp(object) && !_.isFunction(object)) {
			var result = {};
			for(var key in object) {
				result[key] = interpolate_tree(object[key]);
			}
			return result;
		}
		return object;
	};

	return interpolate_tree(object);
}
