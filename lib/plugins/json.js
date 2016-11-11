module.exports.safe = true;

/*
Purpose:
  Executes JsonPath queries to extract a single value or an array of values from an object.

  Each key is the location where the captures will be stored. The value of each key should be a jquery path.
  If the path/value is a single-value array, then all matches will be captured as an array.

Syntax:
  - json:
      key1: "jquery path to capture" # only first instance will be captured
      array1: [ "jquery path" ] # all instances will be captured
*/

var _ = require("lodash");
var jsonpath = require("jsonpath");

module.exports.normalize = function (action) {
	if (_.isString(action.json)) {
		action.json = [action.json];
		return action;
	}
};

function evaluate(target, key, debug) {
	var isOptional = key[0] == "?";
	if (isOptional) {
		key = key.substring(1);
	}
	try {
		if (debug) {
			debugger;
		}
		var result = jsonpath.query(target, key);
		if (!isOptional && result.length === 0) {
			throw { message: "Could not find non-optional element in JSON", target: target, json_path: key, code: 100 };
		}
		return result;
	}
	catch (err) {
		if (err.code === 100) {
			throw err;
		}
		throw { message: "Error in JSONPath expression", target: target, json_path: key, error: err.message };
	}
}

module.exports.process = function (context) {
	try {
		var target = this.target;
		if (_.isNil(target) && context.response != null) {
			target = context.response.body;
		}
		if (target == null) {
			return { message: "JSON evaluation target is null" };
		}
		if (_.isString(target)) {
			var json_target = JSON.parse(target);
			if (json_target == null) {
				return { message: "Target could not be parsed as JSON", target: target };
			}
			target = json_target;
		}

		if (_.isArray(this.json)) { // Just a list of expressions to evaluate (to ensure they exist)
			for (var i = 0; i < this.json.length; i++) {
				evaluate(target, this.json[i], this.debugger);
			}
		}
		else { // Capture each expression into the session under the associated key
			for (var key in this.json) {
				var array_capture = _.isArray(this.json[key]);
				if (array_capture) {
					if (this.json[key].length != 1) {
						return { message: "Array capture for JSON must have a single element", target: target, path: this.json[key] };
					}
					this.json[key] = this.json[key][0];
				}
				var result = evaluate(target, this.json[key], this.debugger);
				if (array_capture) {
					context.session[key] = result;
				}
				else {
					context.session[key] = result.length ? result[0] : null;
				}
			}
		}
	}
	catch (err) {
		return err;
	}
}
