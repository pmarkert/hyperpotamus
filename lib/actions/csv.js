module.exports.safe = true;
module.exports.manual_interpolation = ["mapping"];

/*
Purpose:
  Outputs comma-separated values for all fields referenced by the specified array iterating until at least
  one of the arrays exhausted. Optionally prints out a "headers" row at the start. The fields in the array
  must exist as session variables, but the values can be a mixture of arrays or simple values.

  An optional "mapping" object can be specified which has key-names equal to the field names and an
  interpolatable string as the value.

 - csv:
    fields: array_name | <%! array_reference %>
    headers: true|false|only # defaults to false

 Examples:
 - csv:
    array: [ name, address, city, state ]
    mapping:
      state: <% state | upcase %>

 or

 - csv: [ "name", "address.street", "address.city", "address.state", "address.zipcode", "ssn" ]
 */

var _ = require("lodash");
var verror = require("verror");

module.exports.normalize = function (action) {
	if (_.has(action, "csv")) {
		if (_.isArray(action.csv) || _.isString(action.csv)) {
			action.csv = { fields: action.csv };
		}
		return action;
	}
};

module.exports.process = function (context) {
	var fieldNames;

	if (_.isString(this.csv.fields)) { // Must be the name of the array containing the column names
		fieldNames = context.getSessionValue(this.csv.fields, this.path + ".csv.fields");
	}
	else if (_.isArray(this.csv.fields)) {
		fieldNames = this.csv.fields;
	}
	if (!_.isArray(fieldNames)) {
		throw new verror.VError({
			name: "InvalidActionValue.csv",
			info: {
				path: this.path + ".fields",
				value: this.csv.fields
			}
		}, "csv.fields must be an array or array reference");
	}

	if (this.csv.header) {
		if (context.options.emit) {
			context.options.emit(_.map(fieldNames, csv_safe).join(","), this.channel);
		}
		// If header is "only", don't try to write any data rows
		if (this.csv.header === "only") {
			return;
		}
	}

	var exhausted = [];
	while (exhausted.length == 0) {
		var arrays = [];
		var line = "";
		for (var i = 0; i < fieldNames.length; i++) {
			try {
				if (i > 0) {
					line += ",";
				}

				// Lookup each value, if value is an array, pick the current value and add to list to be iterated.
				if (_.has(this.csv.mapping, fieldNames[i])) {
					line += csv_safe(context.interpolate(this.csv.mapping[fieldNames[i]])); // If a mapping exists, use it.
				}
				else {
					var value = context.getSessionValue(fieldNames[i], `${this.path}.csv.fields[${i}]`);
					if (_.isArray(value)) {
						if (value.length == 0) {
							break; // No rows to process
						}
						arrays.push(fieldNames[i]);
						line += csv_safe(value[value.currentIndex || 0]);
					}
					else {
						line += csv_safe(value);
					}
				}
			}
			catch (err) {
				if (err instanceof verror.VError) {
					throw err;
				}
				throw new verror.VError({
					name: "CsvProcessingError",
					cause: err,
					info: _.defaults(verror.info(err), {
						field: fieldNames[i]
					})
				}, "Unexpected error processing csv field - %s - %s", fieldNames[i]. err);
			}
		}
		context.options.emit(line, this.channel);
		if (this.csv.iterate) {
			arrays = _.union(arrays, _.castArray(this.csv.iterate));
		}
		if (arrays.length == 0) {
			break;
		}
		exhausted = context.iterateArrays(arrays);
	}
};

function csv_safe(value) {
	value = value.toString().split("\"").join("\\\"");
	if (value.indexOf(",") >= 0) {
		value = "\"" + value + "\"";
	}
	return value;
}
