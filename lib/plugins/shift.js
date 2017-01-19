module.exports.safe = true;

/*
Purpose:
  Shifts an element from the front of an array.
  The "array" property specifies the name (or array reference) to the target array.
  The "key" property is the location where value will be stored.

 Example:
  - shift:
      array: array_name || <%! array_reference %>
      key: key_name
*/

var _ = require("lodash");

module.exports.process = function(context) {
	if(!_.has(this.shift, "key")) {
		throw new Error("shift action requires a .key property");
	}
	if(!_.has(this.shift, "array")) {
		throw new Error("shift action requires a .array property");
	}
	var array = this.shift.array;
	if(_.isString(array)) {
		array = context.session[this.shift.array];
	}
	if(!_.isArray(array)) {
		throw new Error(".array property must be an array name or array reference");
	}
	context.session[this.shift.key] = array.shift();
};
