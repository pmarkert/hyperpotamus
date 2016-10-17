module.exports.safe = true;
module.exports.manual_interpolation = true;

/*
Purpose:
  Outputs comma-separated values for all fields referenced by the specified array iterating until at least
  one of the arrays exhausted. Optionally prints out a "headers" row at the start. The fields in the array
  must exist as session variables, but the values can be a mixture of arrays or simple values.

  An optional "mapping" object can be specified which has key-names equal to the field names and an
  interpolatable string as the value.

 - csv:
    array: array_name | <%! array_reference %>
    headers: true|false # defaults to false

 Examples:
 - csv:
    array: [ name, address, city, state ]
    mapping:
      state: <% state | upcase %>

 or

 - csv: [ "name", "address.street", "address.city", "address.state", "address.zipcode", "ssn" ]
 */

var _ = require("underscore");

module.exports.process = function (context, callback) {
	// Manual Interpolation to protect mapping values until iteration time
	this.csv.array = context.interpolate(this.csv.array, context.session);
	this.csv.header = context.interpolate(this.csv.header, context.session);

	var self = this;
	var fieldNames;

	if (_.isString(this.csv.array)) { // Must be the name of the array containing the column names
		fieldNames = context.session[this.csv.array];
		if (!_.isArray(fieldNames)) {
			throw new Error("csv property does not refer to an array of field names");
		}
	}
	else if (_.isArray(this.csv.array)) {
		fieldNames = this.csv.array;
	}
	else {
		throw new Error("csv .array property is not an array name or array reference");
	}

	if (this.csv.header) {
		if (context.options.emit) {
			context.options.emit(_.map(fieldNames, csv_safe).join(","), this.channel);
		}
	}

	var exhausted = false;
	while (!exhausted) {
		var result = "";
		for (var i = 0; i < fieldNames.length; i++) {
			if (i > 0) {
				result += ",";
			}

			// Lookup each value, if value is an array, pick the current value and add to list to be iterated.
			var value;
			if (_.has(this.csv.mapping, fieldNames[i])) {
				value = context.interpolate(this.csv.mapping[fieldNames], context.session); // If a mapping exists, use it.
			}
			else {
				value = context.interpolate("<%!" + fieldNames[i] + "%>", context.session); // retrieve the value (not as a string)
			}
			if (_.isArray(value)) {
				result += csv_safe(value[value.currentIndex || 0]);
				// TODO - "borrowed" from iterate.js - need to refactor to a shared function
				if (!_.has(value, "currentIndex")) { // This is the first time, so the index was 0 before incrementing
					module.exports.logger.trace("Iteration for " + fieldNames[i] + " initializing to 0.");
					value.currentIndex = 0;
				}
				if (value.currentIndex < value.length - 1) { // If we still have elements
					module.exports.logger.trace("Iteration for " + fieldNames[i] + " iterating.");
					value.currentIndex++;
				}
				else { // We reached the end
					module.exports.logger.trace("Iteration for " + fieldNames[i] + " exhausted.");
					delete(value.currentIndex);
					exhausted = true;
				}
			}
			else {
				result += csv_safe(value);
			}
		}
		if (context.options.emit) {
			context.options.emit(result, this.channel);
		}
	}
}

function csv_safe(value) {
	value = value.toString().split("\"").join("\\\"");
	if (value.indexOf(",") >= 0) {
		value = "\"" + value + "\"";
	}
	return value;
}
