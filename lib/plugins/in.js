module.exports.safe = true;

/*
Purpose:
  Checks to see if a value matches any member of an array

Examples:
  in: 
    value: <% value %>
    array: [ item1, ... itemn ]
========
  in: 
    value: <% value %>
    array: array_name
*/

var _ = require("lodash");

module.exports.process = function (context) {
	var value = this["in"].value;
	var array = this["in"].array;

	if (!_.isArray(array)) {
		array = context.session[this["in"].array];
		if (!_.isArray(array)) {
			array = [array];
		}
	}
	if (!_.includes(array, value)) {
		throw { message: "Element was not found in the array.", value: value, array: array };
	}
};
