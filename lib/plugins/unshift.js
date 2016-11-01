module.exports.safe = true;

/*
Purpose:
  Unshifts an element onto the front of an array.
  The "array" property specifies the name (or array reference) to the target array.
  The "value" property is the value that will be added to the front of the target array.

 Example:
  - unshift:
      array: array_name || <%! array_reference %>
      value: <% value_to_append %>
*/

var _ = require("lodash");

module.exports.process = function(context) {
	if(!_.has(this.unshift, "value")) {
		throw new Error("unshift action requires a .value property");
	}
	if(!_.has(this.unshift, "array")) {
		throw new Error("unshift action requires a .array property");
	}
	var array = this.unshift.array;
	if(_.isString(array)) {
		if(!_.has(context.session, this.unshift.array)) {
			context.session[this.unshift.array] = [];
		}
		array = context.session[this.unshift.array];
	}
	if(!_.isArray(array)) {
		throw new Error(".array property must be an array name or array reference");
	}
	if(_.isArray(this.unshift.value)) {
		// Need to modify the original array in-place
		Array.prototype.unshift.apply(array, this.unshift.value);
	}
	else {
		array.unshift(this.unshift.value);
	}
}
