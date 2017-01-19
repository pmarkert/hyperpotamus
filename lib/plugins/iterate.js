module.exports.safe = true;

/* 
 Purpose:
 Advances the current index for a list of session arrays to be iterated.
 List of session_arrays will be coerced to a list if it's a single element.
 If any of the arrays are exhausted, processing continues at the next step, however
 if all of the arrays could be advanced, will jump to the specified jump_key.

 .iterate is a list of session array keys
 .next is the optional jump_key when iteration is complete, defaults to "SELF" to repeat the current step.

 Examples:
 iterate: [ session_array_key_1 ... session_array_key_n ]
 next: jump_to_key
 ========
 iterate: session_array_key
 */

var _ = require("lodash");

module.exports.normalize = function(action, normalize_action) {
	if (_.has(action, "iterate")) {
		action.iterate = _.castArray(action.iterate);

		if (!_.has(action, "next")) {
			action.next = { goto: "SELF" };
		}
		if (_.isString(action.next)) {
			action.next = { goto: action.next };
		}
		action.next = normalize_action(action.next, "next");

		return action;
	}
};

module.exports.process = function(context) {
	var exhausted = context.iterateArrays(this.iterate);
	if(exhausted.length == 0) {
		return context.processAction(this.next);
	}
};
