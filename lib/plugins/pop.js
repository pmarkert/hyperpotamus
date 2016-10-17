module.exports.safe = true;

/*
Purpose:
  Pops an element from the end of an array.
  The "array" property specifies the name (or array reference) to the target array.
  The "key" property is the location where value will be stored.

 Example:
  - pop:
      array: array_name || <%! array_reference %>
      key: key_name
*/

var _ = require("underscore");

module.exports.process = function(context) {
	if(!_.has(this, "key")) {
		throw new Error("pop action requires a .key property");
	}
	if(!_.has(this, "array")) {
		throw new Error("pop action requires a .array property");
	}
	var array = this.array;
	if(_.isString(array)) {
		array = context.session[this.array];
	}
	if(!_.isArray(array)) {
		throw new Error(".array property must be an array name or array reference");
	}
	context.session[this.key] = array.pop();
}
