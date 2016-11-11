var _ = require("lodash");
var pipes = require("./pipes");

/* Unfortunately, Mark has to be global because of the way they add in extras */
Mark = require("markup-js");
require("markup-js/src/extras/arrays");
require("markup-js/src/extras/dates");
require("markup-js/src/extras/i18n");
require("markup-js/src/extras/numbers");
require("markup-js/src/extras/strings");

var options = {
	delimiter: ",",
	pipes: pipes,
	start_delimiter: "<%",
	end_delimiter: "%>",

	undefinedResult: function undefinedResult(property, tag, context, child, filters, markup) {
		property = property.trim();
		if (property == "") {
			// Check for null token (useful for just invoking filters)
			return markup._pipe(property, filters);
		}
		// Check for literal surrounded by single or double quotes
		var match = /(['"])(.+?)(\1)/.exec(property);
		if (match) {
			return markup._pipe(match[2], filters);
		}

		// Otherwise, if the value was null, check to see if the first filter is 'optional'
		var first_filter = _.first(filters);
		if (!_.isNil(first_filter)) {
			var parts = first_filter.split(markup.delimiter);
			if (parts[0].trim() == "optional") {
				return markup._pipe(undefined, filters);
			}
		}
		throw new Error("No value found for non-optional replacement - key: " + property + ", tag: " + tag);
	},

	pipelineError: function pipelineError(err) {
		throw err;
	}
};

module.exports = function (object, data, excluded_properties) {
	excluded_properties = _.defaultTo(excluded_properties, []);
	return interpolate_tree(object);

	function interpolate_tree(object) {
		if (_.isString(object)) {
			return Mark.up(object, data, options);
		}
		else if (_.isArray(object)) {
			return _.map(object, interpolate_tree);
		}
		else if (_.isObject(object) && !_.isRegExp(object) && !_.isFunction(object)) {
			return _.mapValues(object, function (value, key) {
				return _.includes(excluded_properties, key) ? value : interpolate_tree(value);
			});
		}
		else {
			return object;
		}
	}
};
