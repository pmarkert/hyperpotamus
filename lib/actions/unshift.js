module.exports.safe = true;

/*
Purpose:
  Pushes an element onto the beginning of an array, or prepends one array onto the beginning of another.
  The "array" property specifies the name (or array reference) to the target array.
  The "value" property is the value that will be added to the front of the target array.

 Example:
  - unshift:
      array: array_name || <%! array_reference %>
      value: value  ||
*/

var _ = require("lodash");
var verror = require("verror");

module.exports.normalize = function(action, normalizer, path) {
	if(_.has(action, "unshift")) {
		if(_.has(action.unshift, "target")) {
			if(_.has(action.unshift, "array")) {
				throw new verror.VError({
					name: "ActionStructureError.unshift",
					info: {
						path: path
					}
				}, "Cannot specify both .array and .target (which is an alias for .array)");
			}
			action.unshift.array = action.unshift.target;
			delete(action.unshift.target);
		}
		return action;
	}
};

module.exports.process = function (context) {
	if (!(_.has(this.unshift, "value"))) {
		throw new verror.VError({
			name: "InvalidActionValue.unshift",
			info: {
				path: this.path + ".unshift.value",
				value: this.unshift.value
			}
		}, "unshift action requires a .value value");
	}
	if (!_.has(this.unshift, "array")) {
		throw new verror.VError({
			name: "InvalidActionTarget.unshift",
			info: {
				path: this.path + ".unshift.array"
			}
		}, "unshift action requires an .array value");
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
			name: "InvalidActionTarget.unshift",
			info: {
				path: this.path + ".unshift.array"
			}
		}, "unshift.array must be an array or array reference");
	}
	if (_.isArray(this.unshift.value)) {
		// Need to modify the original array in-place
		Array.prototype.unshift.apply(array, this.unshift.value);
	}
	else {
		array.unshift(this.unshift.value);
	}
};

