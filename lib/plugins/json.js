var _ = require("underscore");
var interpolate;
var jsonpath = require("JSONPath");

module.exports.name = "json";

module.exports.handles = function(action) {
	return _.isObject(action.json);
}

module.exports.process = function(action, context, callback) {
	if(action.debugger) debugger;
	var target = context.response.body;
	if(action.target)
		target = context.session[action.target];
	
	for(var key in action.json) {
		var result = jsonpath.eval(target, action.json[key]);
		if(result.length==0) {
			throw new Error("Could not find element in JSON");
		}
		else if(result.length==1) {
			context.session[key] = result[0];
		}
		else {
			context.session[key] = result;
		}
	}
	callback();
}
