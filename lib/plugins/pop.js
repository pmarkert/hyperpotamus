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

var _ = require("lodash");
var verror = require("verror");

module.exports.process = function (context) {
	if (!_.isString(this.pop.key)) {
		throw new verror.VError({
			name: "InvalidActionValue.pop",
			info: {
				path: this.path + ".pop.key",
				value: this.pop.key
			}
		}, "pop.key must be a string key reference");
	}
	if (!_.has(this.pop, "array")) {
		throw new verror.VError({
			name: "InvalidActionValue.pop",
			info: {
				path: this.path + ".pop.array"
			}
		}, "pop.array must be an array or array reference");
	}
	var array = this.pop.array;
	if (_.isString(array)) {
		array = context.interpolate("<%!" + this.pop.array + "%>");
	}
	if (!_.isArray(array)) {
		throw new verror.VError({
			name: "InvalidActionValue.pop",
			info: {
				path: this.path + ".pop.array"
			}
		}, "pop.array must be an array or array reference");
	}
	_.set(context.session, this.pop.key, array.pop());
};