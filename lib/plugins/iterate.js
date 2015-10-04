var _ = require("underscore");
var logger = require("../logging").logger("hyperpotamus.plugins.iterate");

module.exports.name = "iterate";
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

module.exports = { 
	normalize: normalize,
	handles: handles,
	process: process
}

function normalize(action) {
	if(handles(action)) {
		if(!action.next) action.next = "SELF";
		// Coerce single value for array to iterate to list of arrays to iterate
		if(!_.isArray(action.iterate)) {
			action.iterate = [ action.iterate ];
		}
		return action;
	}
}

function handles(action) {
	return !_.isUndefined(action.iterate);
}

function process(context) {
        for(var i=0; i<this.iterate.length; i++) { // Increment the .index for each array in the array of [iterate]
                if(!_.isArray(context.session[this.iterate[i]])) { // If it's not an array, pretend it's an array of one (and jump right away)
			logger.trace("Iteration for " + this.iterate[i] + " was not an array.");
			return;
		}
                else {
			var index = this.iterate[i] + ".index";
                        if(!context.session[index] ) { // This is the first time, so the index was 0 before incrementing
				logger.trace("Iteration for " + this.iterate[i] + " initializing to 0.");
                                context.session[index] = 0;
                        }
                        if(context.session[index] < context.session[this.iterate[i]].length - 1) { // If we still have elements
				logger.trace("Iteration for " + this.iterate[i] + " iterating.");
                                context.session[index]++;
                        }
                        else { // We reached the end
				logger.trace("Iteration for " + this.iterate[i] + " exhausted.");
				// TODO - technically, if there are multiple arrays being iterated, once the first gets completed, it
				// stops checking the others, so the final state of the others will be behind by one.
                                delete(context.session[index]);
				return;
                        }
                }
        }
	return { jump_to_key: this.next };
}
