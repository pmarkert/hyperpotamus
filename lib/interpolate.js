var _ = require("lodash");
var pipes = require("./pipes");
var verror = require("verror");

var calfinated = require("calfinated")();
calfinated.add_pipes(pipes);

var options = {
	delimiter: ",",
	pipes: pipes,
	start_delimiter: "<%",
	end_delimiter: "%>",

	undefinedResult: function undefinedResult(property, tag, context, child, filters, markup) {
		if(_.isArray(property)) {
			property = property.join(".");
		}
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
		throw new verror.VError({
			name: "MissingKeyError",
			constructorOpt: module.exports,
			info: {
				key: property,
				tag
			}
		}, "No matching value found in the session. Key: %s", property);
	},

	pipeNotFound: function pipeNotFound(pipe) {
		throw new verror.VError({
			name: "PipeNotFoundError",
			info: {
				pipe
			}
		}, "Pipe function: %s could not be found", pipe);
	},

	pipeExecutionError: function pipelineError(err, pipe) {
		throw new verror.VError({
			name: "PipeExecutionError",
			cause: err,
			info: _.defaults(verror.info(err), {
				pipe
			}),
		}, "Error in pipe '%s' during execution", pipe);
	}
};

calfinated.missingKeyError = options.undefinedResult;
calfinated.pipeExecutionError = options.pipeExecutionError;
calfinated.pipeNotFound = options.pipeNotFound;

module.exports = function interpolate(target, data, excluded_properties) {
	excluded_properties = _.defaultTo(excluded_properties, []);
	return interpolate_tree(target);

	function interpolate_tree(target) {
		if (_.isString(target)) {
			return calfinated.process(target, data, options);
		}
		else if (_.isArray(target)) {
			return _.map(target, interpolate_tree);
		}
		else if (_.isPlainObject(target) && !_.isRegExp(target) && !_.isFunction(target)) {
			return _.mapValues(target, function (value, key) {
				return _.includes(excluded_properties, key) ? value : interpolate_tree(value);
			});
		}
		else {
			return target;
		}
	}
};
