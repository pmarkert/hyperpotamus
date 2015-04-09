var _ = require("underscore");
var logger = require("../logging").logger("hyperpotamus.plugins.function");

module.exports.name = "function";

module.exports.safe = false;

module.exports.normalize = function(action) {
	if(_.isFunction(action)) {
		action = { "function": action };
	}
	if(_.isObject(action.imports)) {
		for(var key in action.imports) {
			action.imports[key] = require(action.imports[key]);
		}
	}
}

module.exports.handles = function(action) {
	return _.isFunction(action) || _.isFunction(action["function"]);
}

module.exports.process = function(context, callback) {
	if(this.debugger) debugger;
	logger.debug("About to invoke custom function");
	var func = this["function"];
	if(func.length==1) { // Synchronous function
		func.call(this, context);
		return callback();
	}
	else if(func.length==2) {
		func.call(this, context, function(err) {
			if(err) return callback(err, context.response, "Custom function");
			return callback();
		});
	}
	else {
		throw { message : "Custom function has unexepcted number of arguments.", number_of_argument : func.length };
	}
}
