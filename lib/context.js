var _ = require("lodash");
var interpolator = require("./interpolate");
var logger = require("./logging").logger("hyperpotamus.context");

module.exports = Context;

function Context(session, processor, processAction, handleDirective) {
	this.session = _.defaults(session, processor.options.sessionDefaults);

	this.options = processor.options;
	/* TODO - Refactoring needed
	    These are sticking out because of the clone operation ideally the processor object
	    would be the only parameter (other than session) and we would wrap the other two functions around that
	    but right now, they are inside of a closure, so are inaccessible on the processor level.
	 */
	this._processor = processor;
	this._raw_process_action = processAction;
	this._raw_handle_directive = handleDirective;

	this.processAction = function(actions) { return processAction(actions, this); };

	this.handleDirective = function(directive) {
		directive.context = this; 
		return handleDirective(directive, this.current_step);
	};

	this.interpolate = function interpolate(target, excluded_properties) {
		return interpolator(target, this.session, excluded_properties);
	};
	
	this.clone = function(sharedProperties) {
		sharedProperties = _.isNil(sharedProperties) ? [] : _.castArray(sharedProperties);
		// Deep clone except for the sharedProperties
		var new_session =_.cloneDeepWith(this.session, function(value, key, object) {
			if(_.includes(sharedProperties, key)) {
				return object[key];
			}
		});
		return new Context(new_session, this._processor, this._raw_process_action, this._raw_handle_directive);
	};

	this.iterateArrays = function iterateArrays(arrays) {
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
