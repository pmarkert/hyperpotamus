var _ = require("underscore");
var interpolate;
var jsonpath = require("jsonpath");

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
	var isOptional = key[0] == "?";
	if(isOptional) {
		key = key.substring(1);
	}
        try {
		var result = jsonpath.query(target, key);
		if(!isOptional && result.length === 0) {
			throw { message : "Could not find non-optional element in JSON", target : target, json_path : key };
		}
		return result;
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
			return { message : "JSON evaluation target is null" };
		}
		if(_.isString(target)) {
			json_target = JSON.parse(target);
			if(json_target==null) {
				return { message : "Target could not be parsed as JSON", target : target };
			}
			target = json_target;
		}
		
		if(_.isArray(this.json)) { // Just a list of expressions to evaluate (to ensure they exist)
			for(var i=0;i<this.json.length;i++) {
				evaluate(target, this.json[i]);
			}
		}
		else { // Capture each expression into the session under the associated key
			for(var key in this.json) {
				var array_capture = _.isArray(this.json[key]);
				if(array_capture) {
					if(this.json[key].length!=1) {
						return { message : "Array capture for JSON must have a single element", target : target, path : this.json[key] };
					}
					this.json[key] = this.json[key][0];
				}
				var result = evaluate(target, this.json[key]);
				if(array_capture) {
					context.session[key] = result;
				}
				else {
					context.session[key] = result.length ? result[0] : null;
				}
			}
		}
	}
	catch(err) {
		return err;
	}
}
