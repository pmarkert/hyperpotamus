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
var verror = require("verror");
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
			// eslint-disable-next-line no-debugger
			debugger;
		}
		var result = jsonpath.query(target, key);
		if (!isOptional && result.length === 0) {
			throw new verror.VError({
				name: "JsonValueNotMatched",
				info: {
					key,
					target
				}
			}, "Could not find non-optional element in JSON - %s", key);
		}
		return result;
	}
	catch (err) {
		if (err instanceof verror.VError) {
			throw err;
		}
		throw new verror.VError({
			name: "JsonPathError",
			info: {
				target,
				json_path: key,
				cause: err
			}
		}, "Error processing JSONPath expression - " + key);
	}
}

module.exports.process = function (context) {
	var target = this.target;
	if(_.isNil(target)) {
		var response = context.getSessionValue("hyperpotamus.response", null, undefined);
		if (_.isNil(response)) {
			throw new verror.VError({
				name: "InvalidActionPlacement.json",
				info: {
					path: this.path + ".json"
				}
			}, "If the json action is not used within the .response of a request action, then an explicit .target must be specified.");
		}
		target = response.body;
	}
	if (_.isNil(target)) {
		throw new verror.VError({
			name: "InvalidJsonTarget",
			info: {
				path: this.path + ".target"
			},
		}, "JSON evaluation target is null");
	}
	if (_.isString(target)) {
		target = JSON.parse(target);
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
					throw new verror.VError({
						name: "InvalidJsonCaptureValue",
						info: {
							key,
							value: this.json[key]
						}
					}, "If json.capture element is an array, it must have a single element");
				}
				this.json[key] = this.json[key][0];
			}
			var result = evaluate(target, this.json[key], this.debugger);
			if (array_capture) {
				context.setSessionValue(key, result);
			}
			else {
				context.setSessionValue(key, result.length ? result[0] : null);
			}
		}
	}
};
