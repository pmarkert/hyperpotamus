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
var verror = require("verror");

module.exports.process = function (context) {
	if (!(_.isString(this.unshift.value) || _.isArray(this.unshift.value))) {
		throw new verror.VError({
			name: "InvalidActionValue.unshift",
			info: {
				path: this.path + ".unshift.value",
				value: this.unshift.value
			}
		}, "unshift action requires a string or array .value property");
	}
	if (!_.has(this.unshift, "array")) {
		throw new verror.VError({
			name: "InvalidActionValue.unshift",
			info: {
				path: this.path + ".unshift.array"
			}
		}, "unshift action requires a .array value");
	}
	var array = this.unshift.array;
	if (_.isString(array)) {
		if (!_.has(context.session, this.unshift.array)) {
			_.set(context.session, this.unshift.array, []);
		}
		array = _.get(context.session, this.unshift.array);
	}
	if (!_.isArray(array)) {
		throw new verror.VError({
			name: "InvalidActionValue.unshift",
			info: {
				path: this.path + ".unshift.array"
			}
		}, "unshift.array property must be an array or array reference");
	}
	if (_.isArray(this.unshift.value)) {
		// Need to modify the original array in-place
		Array.prototype.unshift.apply(array, this.unshift.value);
	}
	else {
		array.unshift(this.unshift.value);
	}
};
