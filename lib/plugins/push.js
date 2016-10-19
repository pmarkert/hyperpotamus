module.exports.safe = true;

/*
Purpose:
  Pushes an element onto the end of an array.
  The "array" property specifies the name (or array reference) to the target array.
  The "value" property is the value that will be added to the end of the target array.

 Example:
  - push:
      array: array_name || <%! array_reference %>
      value: <% value_to_append %>
*/

var _ = require("underscore");

module.exports.process = function(context) {
	if(!_.has(this, "value")) {
		throw new Error("push action requires a .value property");
	}
	if(!_.has(this, "array")) {
		throw new Error("push action requires a .array property");
	}
	var array = this.array;
	if(_.isString(array)) {
		array = context.session[this.array];
	}
	if(!_.isArray(array)) {
		throw new Error(".array property must be an array name or array reference");
	}
	array.push(this.value);
}