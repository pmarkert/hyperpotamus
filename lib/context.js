var _ = require("lodash");
var interpolate = require("./interpolate");

module.exports = Context;

function Context(session, processor, process_action, done) {
	this.session = _.defaults(session, processor.options.default_session);
	this.options = processor.options;

	this.process_action = process_action;
	this.interpolate = interpolate;

	this.done = done;
}
