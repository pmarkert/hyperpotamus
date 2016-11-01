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

var _ = require("lodash");

module.exports.process = function(context) {
	if(!_.has(this.push, "value")) {
		throw new Error("push action requires a .value property");
	}
	if(!_.has(this.push, "array")) {
		throw new Error("push action requires a .array property");
	}
	var array = this.push.array;
	if(_.isString(array)) {
		if(!_.has(context.session, this.push.array)) {
			context.session[this.push.array] = [];
		}
		array = context.session[this.push.array];
	}
	if(!_.isArray(array)) {
		throw new Error(".array property must be an array name or array reference");
	}
	if(_.isArray(this.push.value)) {
		array.concat(this.push.value);
	}
	else {
		array.push(this.push.value);
	}
}
