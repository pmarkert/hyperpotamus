var _ = require("underscore");
var interpolate;
var jsonpath = require("JSONPath");

module.exports.name = "json";

module.exports.safe = true;

module.exports.handles = function(action) {
	return _.isObject(action.json) || _.isArray(action.json) || _.isString(action.json);
}

module.exports.normalize = function(action) {
	if(_.isString(action.json)) {
		action.json = [ action.json ];
	}
	return action;
}

function evaluate(target, key) {
	if(key==="$") return target;
	return jsonpath.eval(target, key);
}

module.exports.process = function(context) {
	if(this.debugger) debugger;
	var target = context.response.body;
	if(this.target)
		target = context.session[this.target];
	if(_.isString(target))
		target = JSON.parse(target);
	
	if(_.isArray(this.json)) {
		for(var i=0;i<this.json.length;i++) {
			var result = evaluate(target, this.json[i]);
			if(!result) {
				throw { message : "Could not find element in JSON", target : target, json_path: this.json[i] };
			}
		}
	}
	else {
		for(var key in this.json) {
			var result = evaluate(target, this.json[key]);
			if(result.length==0) {
				throw { message : "Could not find element in JSON", target : target, json_path: this.json[key] };
			}
			else if(result.length==1) {
				context.session[key] = result[0];
			}
			else {
				context.session[key] = result;
			}
		}
	}
}
