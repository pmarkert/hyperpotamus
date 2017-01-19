module.exports.safe = true;

/*
Purpose:
  Echoes text back to the output stream, optionally specifying a named channel.
  If no channel is specified, the default output stream is used.

Aliases:
  emit

Examples:
  print: Success
====
  print: <% session_id %> completed
  channel: sessions
*/

var _ = require("lodash");

module.exports.normalize = function(action) {
	if(_.has(action, "emit")) {
		action.print = action.emit;
		delete(action.emit);
		return action;
	}
};

module.exports.process = function (context) {
	if (context.options.emit) {
		context.options.emit(this.print, this.channel);
	}
};
