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
	var exhausted = false;
        for(var i=0; i<this.iterate.length; i++) { // Increment the index for each array in the list
                if(!_.isArray(context.session[this.iterate[i]])) { // If it's not an array, pretend it was an array of one
			logger.info("Iteration for " + this.iterate[i] + " was not an array.");
			exhausted = true;
		}
                else {
			var array = context.session[this.iterate[i]];
                        if(!_.has(array,"currentIndex") ) { // This is the first time, so the index was 0 before incrementing
				logger.trace("Iteration for " + this.iterate[i] + " initializing to 0.");
                                array.currentIndex = 0;
                        }
                        if(array.currentIndex < array.length - 1) { // If we still have elements
				logger.trace("Iteration for " + this.iterate[i] + " iterating.");
				array.currentIndex++;
                        }
                        else { // We reached the end
				logger.trace("Iteration for " + this.iterate[i] + " exhausted.");
                                delete(array.currentIndex);
				exhausted = true;
                        }
                }
        }
	return exhausted ? null : { jump_to_key: this.next };
}
