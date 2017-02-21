var _ = require("lodash");
var interpolator = require("./interpolate");
var logger = require("./logging").logger("hyperpotamus.context");
var ProcessingDirective = require("./processingDirective");
var verror = require("verror");

module.exports = Context;

function Context(session, processor, _processAction, _handleDirective) {
	// When bluebird calls handleDirective in error handlers 'this' context is not properly set.
	var self = this; 
	this.session = _.defaults(session, processor.options.sessionDefaults);

	this.options = processor.options;
	/* TODO - Refactoring needed
	    These are sticking out because of the clone operation ideally the processor object
	    would be the only parameter (other than session) and we would wrap the other two functions around that
	    but right now, they are inside of a closure, so are inaccessible on the processor level.
	 */
	this._processor = processor;
	this._raw_process_action = _processAction;
	this._raw_handle_directive = _handleDirective;
	this.ProcessingDirective = ProcessingDirective;

	this.processAction = function processAction(actions) {
		return _processAction(actions, self);
	};

	this.handleDirective = function handleDirective(directive) {
		directive.context = self;
		return _handleDirective(directive, self.current_step);
	};

	this.interpolate = function interpolate(target, excluded_properties) {
		return interpolator(target, self.session, excluded_properties);
	};

	this.clone = function clone(with_session_data) {
		var new_session = _.defaults(with_session_data, _.cloneDeep(self.session));
		return new Context(new_session, self._processor, self._raw_process_action, self._raw_handle_directive);
	};
	
	this.getSessionValue = function getSessionValue(key, path) {
		var result = _.get(this.session, key);
		if(_.isUndefined(result)) {
			throw new verror.VError({
				name: "MissingKeyError",
				constructorOpt: this.getSessionValue,
				info: {
					key,
					path
				}
			}, "No matching value found in the session. Key: %s", key);
		}
		return result;
	};
	
	this.setSessionValue = function(path, value) {
		_.set(this.session, path, value);
	};

	this.iterateArrays = function iterateArrays(arrays) {
		var exhausted = [];
		arrays = _.castArray(arrays);
		for (var i = 0; i < arrays.length; i++) { // Increment the index for each array in the list
			if (!_.isArray(_.get(self.session,arrays[i]))) { // If it's not an array, pretend it was an array of one
				logger.info("Iteration for " + arrays[i] + " was not an array.");
				exhausted.push(arrays[i]);
			}
			else {
				var array = _.get(self.session,arrays[i]);
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
