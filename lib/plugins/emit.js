module.exports.name = "emit";
module.exports.safe = true;

var logger = require("../logging").logger("hyperpotamus.plugins." + module.exports.name);

/*
Purpose:
  Echoes text back to the output stream, optionally specifying a named channel.
  If no channel is specified, the default output stream is used.

Examples:
  emit: Success
====
  emit: <% session_id %> completed
  channel: sessions
*/

var _ = require("underscore");

module.exports.handles = function(action) {
	return !_.isUndefined(action.emit);
}

module.exports.process = function(context) {
	if(context.options.emit) context.options.emit(this.emit, this.channel);
}
