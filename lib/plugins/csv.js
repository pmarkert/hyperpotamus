var _ = require("underscore");
var logger = require("../logging").logger("hyperpotamus.plugins.csv");

/*
- csv: array_name_for_field_list
  headers: true|false

or

- csv:
   - name
   - address
   - city

or

- csv: [ "name", "address.street", "address.city", "address.state", "address.zipcode", "ssn" ]
  headers: true|false
*/

module.exports.name = "csv";

module.exports.safe = true;

module.exports.handles = function(action) {
	return _.isString(action.csv) || _.isArray(action.csv);
}

module.exports.process = function(context, callback) {
	var self = this;
	var fieldNames;
	if(_.isString(this.csv)) { // Must be the name of the array containing the column names
		fieldNames = context.session[this.csv];
		if(!_.isArray(fieldNames)) {
			throw new Error("csv property does not refer to an array of field names");
		}
	}
	else if(_.isArray(this.csv)) {
		fieldNames = this.csv;
	}
	else {
		throw new Error("csv property is not an array or array name");
	}
	var header = "";
	if(this.header) {
		for(var i=0;i<fieldNames.length;i++) {
			if(i>0) header += ",";
			header += csv_safe(fieldNames[i]);
		}
		if(context.options.emit) context.options.emit(header, this.channel);
	}
	var arrays = [];
	var exhausted = false;
	while(!exhausted) {
		var result = "";
		for(var i=0;i<fieldNames.length;i++) {
			if(i>0) result += ",";

			// Lookup each value, if value is an array, pick the current value and add to list to be iterated.
			var value = context.interpolate("<%!" + fieldNames[i] + "%>", context.session); // ! to retrieve the value not a string
			if(_.isArray(value)) {
				result += csv_safe(value[value.currentIndex || 0]);
				// TODO - "borrowed" from iterate.js - need to refactor to a shared function
				if(!_.has(value,"currentIndex") ) { // This is the first time, so the index was 0 before incrementing
					logger.trace("Iteration for " + fieldNames[i] + " initializing to 0.");
					value.currentIndex = 0;
				}
				if(value.currentIndex < value.length - 1) { // If we still have elements
					logger.trace("Iteration for " + fieldNames[i] + " iterating.");
					value.currentIndex++;
				}
				else { // We reached the end
					logger.trace("Iteration for " + fieldNames[i] + " exhausted.");
					delete(value.currentIndex);
					exhausted = true;
				}
			}
			else {
				result += csv_safe(value);
			}
		}
		if(context.options.emit) context.options.emit(result, this.channel);
	}
}

function csv_safe(value) {
	value = value.split("\"").join("\\\"") ;
	if(value.indexOf(",")>=0) {
		value = "\"" + value + "\"";
	}
	return value;
}
