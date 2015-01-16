var _ = require("underscore");

module.exports.name = "debugger";

module.exports.safe = false;

module.exports.handles = function(action) {
	return action.debugger;
}

module.exports.process = function(action, context, callback) {
	debugger;
	callback();
}
