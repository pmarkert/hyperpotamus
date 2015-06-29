var _ = require("underscore");
var interpolate;
var jsonql = require("jsonql");

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
        try {
		return jsonql(key, target);
        }
	catch(err) {
		if(err.message.search(/Cannot read property '.+?' of undefined/)==0) {
			throw { message : "Could not find element in JSON", target : target, json_path: key };
		}
		throw { message : "Error in JSONPath expression", target : target, json_path: key, error : err.message };
	}
}

module.exports.process = function(context) {
	try {
		if(this.debugger) debugger;
		var target = context.response.body;
		if(this.target)
			target = context.session[this.target];
		if(target == null) {
			throw { message : "JSON evaluation target is null" };
		}
		if(_.isString(target)) {
			json_target = JSON.parse(target);
			if(json_target==null) {
				throw { message : "Target could not be parsed as JSON", target : target };
			}
			target = json_target;
		}
		
		if(_.isArray(this.json)) { // Just a list of expressions to evaluate (to ensure they exist)
			for(var i=0;i<this.json.length;i++) {
				var result = evaluate(target, this.json[i]);
				if(!result) {
					return { message : "JSON path did not match target", target : this.json[i] };
				}
			}
		}
		else { // Capture each expression into the session under the associated key
			for(var key in this.json) {
				var result = evaluate(target, this.json[key]);
				if(result.length==1) {
					context.session[key] = result[0];
				}
				else {
					context.session[key] = result;
				}
			}
		}
	}
	catch(err) {
		return err;
	}
}
