var _ = require("lodash");
var interpolator = require("./interpolate");
var logger = require("./logging").logger("hyperpotamus.context");

module.exports = Context;

function Context(session, processor, process_action, handle_directive) {
	this.session = _.defaults(session, processor.options.default_session);

	this.options = processor.options;

	this.process_action = function(actions) { return process_action(actions, this); };

	this.handle_directive = function(directive) { 
		directive.context = this; 
		return handle_directive(directive, this.current_step);
	};

	this.interpolate = function interpolate(target, excluded_properties) {
		return interpolator(target, this.session, excluded_properties);
	};
	
	this.clone = function() {
		return _.cloneDeep(this);
	};

	this.iterate_arrays = function iterate_arrays(arrays) {
		var exhausted = [];
		arrays = _.castArray(arrays);
		for (var i = 0; i < arrays.length; i++) { // Increment the index for each array in the list
			if (!_.isArray(this.session[arrays[i]])) { // If it's not an array, pretend it was an array of one
				logger.info("Iteration for " + arrays[i] + " was not an array.");
				exhausted.push(arrays[i]);
			}
			else {
				var array = this.session[arrays[i]];
				if (!_.has(array, "currentIndex")) { // This is the first time, so the index was 0 before incrementing
					logger.trace("Iteration for " + arrays[i] + " initializing to 0.");
					array.currentIndex = 0;
				}
				if (array.currentIndex < array.length - 1) { // If we still have elements
					logger.trace("Iteration for " + arrays[i] + " iterating.");
					array.currentIndex++;
				}
				else { // We reached the end
					logger.debug("Iteration for " + arrays[i] + " exhausted.");
					delete(array.currentIndex);
					exhausted.push(arrays[i]);
				}
			}
		}
		return exhausted;
	};
}
