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
			action.next = { goto: "SELF" }
		}
		if (_.isString(action.next)) {
			action.next = { goto: action.next };
		}
		action.next = normalize_action(action.next);

		return action;
	}
};

module.exports.process = function(context) {
	var exhausted = false;
	for (var i = 0; i < this.iterate.length; i++) { // Increment the index for each array in the list
		if (!_.isArray(context.session[this.iterate[i]])) { // If it's not an array, pretend it was an array of one
			module.exports.logger.info("Iteration for " + this.iterate[i] + " was not an array.");
			exhausted = true;
		}
		else {
			var array = context.session[this.iterate[i]];
			if (!_.has(array, "currentIndex")) { // This is the first time, so the index was 0 before incrementing
				module.exports.logger.trace("Iteration for " + this.iterate[i] + " initializing to 0.");
				array.currentIndex = 0;
			}
			if (array.currentIndex < array.length - 1) { // If we still have elements
				module.exports.logger.trace("Iteration for " + this.iterate[i] + " iterating.");
				array.currentIndex++;
			}
			else { // We reached the end
				module.exports.logger.trace("Iteration for " + this.iterate[i] + " exhausted.");
				delete(array.currentIndex);
				exhausted = true;
			}
		}
	}
	if(!exhausted) {
		return context.process_action(this.next, context);
	}
}
