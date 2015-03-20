var _ = require("underscore");

module.exports.name = "emit";

module.exports.safe = true;

module.exports.handles = function(action) {
	return _.isString(action.emit);
}

module.exports.process = function(context, callback) {
	if(this.debugger) debugger;
	if(context.options.emit) context.options.emit(this.emit, this.channel);
	callback();
}
