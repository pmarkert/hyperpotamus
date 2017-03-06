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
var verror = require("verror");

module.exports.process = function (context) {
	var value = this.in.value;
	var array = this.in.array;

	if(_.isString(array)) {
		array = context.getSessionValue(array);
	}
	if (!_.isArray(array)) {
		throw new verror.VError({
			name: "InvalidArrayValue",
			info: {
				path: this.path + ".in.array",
				value: this.in.array
			}
		}, "in.array must be an array or array reference");
	}
	if (!_.includes(array, value)) {
		throw new verror.VError({
			name: "ValueNotFoundInArray",
			info: {
				path: this.path,
				value: this.in.value,
				array: this.in.array
			}
		}, "Element was not found in the array.");
	}
};
