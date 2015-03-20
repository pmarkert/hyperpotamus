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

module.exports.process = function(action, context, callback) {
	if(action.debugger) debugger;
	logger.debug("About to invoke custom function");
	var func = action["function"];
	if(func.length==1) { // Synchronous function
		func.call(action, context);
		return callback();
	}
	else if(func.length==2) {
		func.call(action, context, function(err) {
			if(err) return callback(err, context.response, "Custom function");
			return callback();
		});
	}
	else {
		throw new Error("Custom function has unexepcted number of arguments.");
	}
}
