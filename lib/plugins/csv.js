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
		fieldNames = context.session[this.csv.fields];
		if (!_.isArray(fieldNames)) {
			throw new Error("csv property does not refer to an array of field names");
		}
	}
	else if (_.isArray(this.csv.fields)) {
		fieldNames = this.csv.fields;
	}
	else {
		throw new Error("csv .fields property is not an array name or array reference");
	}

	if (this.csv.header) {
		if (context.options.emit) {
			context.options.emit(_.map(fieldNames, csv_safe).join(","), this.channel);
		}
		// If header is "only", don't try to write any data rows
		if (this.csv.header == "only") {
			return;
		}
	}

	var exhausted = [];
	while (exhausted.length == 0) {
		var arrays = [];
		var result = "";
		for (var i = 0; i < fieldNames.length; i++) {
			try {
				if (i > 0) {
					result += ",";
				}

				// Lookup each value, if value is an array, pick the current value and add to list to be iterated.
				if (_.has(this.csv.mapping, fieldNames[i])) {
					result += csv_safe(context.interpolate(this.csv.mapping[fieldNames[i]])); // If a mapping exists, use it.
				}
				else {
					if (!_.has(context.session, fieldNames[i])) {
						throw new verror.VError({ name: "MissingKeyError", info: { key: fieldNames[i], tag: "csv fields" } }, `Session value for csv output field not found ${fieldNames[i]}`);
					}
					var value = context.session[fieldNames[i]];
					if (_.isArray(value)) {
						if (value.length == 0) {
							throw new Error("array is empty");
						}
						arrays.push(fieldNames[i]);
						result += csv_safe(value[value.currentIndex || 0]);
					}
					else {
						result += csv_safe(value);
					}
				}
			}
			catch (err) {
				if (err instanceof verror.VError) {
					throw err;
				}
				throw new verror.VError({ name: "CSVPluginError", info: { field: fieldNames[i] }, cause: err }, `Unexpected error processing csv field - ${fieldNames[i]}. - ${err}`);
			}
		}
		context.options.emit(result, this.channel);
		if (this.csv.iterate) {
			exhausted = _.union(arrays, _.castArray(this.csv.iterate));
		}
		exhausted = context.iterateArrays(arrays);
		if (arrays.length == 0) {
			break;
		}
	}
};

function csv_safe(value) {
	value = value.toString().split("\"").join("\\\"");
	if (value.indexOf(",") >= 0) {
		value = "\"" + value + "\"";
	}
	return value;
}
