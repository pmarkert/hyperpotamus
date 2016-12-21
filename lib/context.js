var _ = require("lodash");
var interpolator = require("./interpolate");

module.exports = Context;

function Context(session, processor, process_action, handle_directive) {
	this.session = _.defaults(session, processor.options.default_session);

	this.options = processor.options;

	this.process_action = function(actions) { return process_action(actions, this); };

	this.handle_directive = function(directive) { 
		directive.context = this; 
		return handle_directive(directive, this.current_step);
	}

	this.interpolate = function interpolate(target, excluded_properties) {
		return interpolator(target, this.session, excluded_properties);
	};
	
	this.clone = function() {
		return _.cloneDeep(this);
	};
}
