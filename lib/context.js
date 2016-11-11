var _ = require("lodash");
var interpolate = require("./interpolate");

module.exports = Context;

function Context(session, processor, done) {
	this.session = _.defaults(session, processor.options.default_session);
	this.response_defaults = processor.options.response_defaults;
	this.emit = processor.options.emit;
	this.safe = processor.options.safe;

	this.process_action = processor.process_action;
	this.interpolate = interpolate;

	this.done = done;
}