module.exports.safe = true;

/*
Purpose:
  Shifts an element from the start of an array.
  The "array" property specifies the name (or array reference) to the target array.
  The "key" property is the location where value will be stored.

 Example:
  - shift:
      array: array_name || <%! array_reference %>
      key: key_name
*/

var _ = require("lodash");
var verror = require("verror");

module.exports.process = function (context) {
	if (!_.isString(this.shift.key)) {
		throw new verror.VError({
			name: "InvalidActionValue.shift",
			info: {
				path: this.path + ".shift.key",
				value: this.shift.key
			}
		}, "shift.key must be a string key reference");
	}
	if (!_.has(this.shift, "array")) {
		throw new verror.VError({
			name: "InvalidActionValue.shift",
			info: {
				path: this.path + ".shift.array"
			}
		}, "shift.array must be an array or array reference");
	}
	var array = this.shift.array;
	if (_.isString(array)) {
		array = context.interpolate("<%!" + this.shift.array + "%>");
	}
	if (!_.isArray(array)) {
		throw new verror.VError({
			name: "InvalidActionValue.shift",
			info: {
				path: this.path + ".shift.array"
			}
		}, "shift.array must be an array or array reference");
	}
	_.set(context.session, this.shift.key, array.shift());
};