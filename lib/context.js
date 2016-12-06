var _ = require("lodash");
var interpolator = require("./interpolate");

module.exports = Context;

function Context(session, processor, process_action, done) {
	this.session = _.defaults(session, processor.options.default_session);
	this.options = processor.options;

	this.process_action = process_action;
	this.interpolate = function interpolate(target, excluded_properties) {
		return interpolator(target, this.session, excluded_properties);
	};

	this.done = done;
}
