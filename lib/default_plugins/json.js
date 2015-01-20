var _ = require("underscore");
var interpolate;
var jsonpath = require("JSONPath");

module.exports.name = "json";

module.exports.handles = function(action) {
	return _.isObject(action.json);
}

module.exports.process = function(action, context, callback) {
	var target = context.body;
	if(action.target)
		target = context.session[action.target];
	
	for(var key in action.json) {
		context.session[key] = jsonpath.eval(target, action.json[key]);
	}
	callback();
}
