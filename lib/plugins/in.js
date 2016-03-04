var _ = require("underscore");
var logger = require("../logging").logger("hyperpotamus.plugins.compare");

module.exports.name = "compare";
module.exports.safe = true;

/*
Purpose:
  Checks to see if a value matches any member of an array

Examples:
  in: 
    value: <% value %>
    array: [ item1, ... itemn ]
========
  in: 
    value: <% value %>
    array: array_name
*/

module.exports = {
	handles: handles,
	process: process
}

function handles(action) {
	return _.isObject(action) && _.isObject(action["in"]);
}

function process(context) {
	var value = this["in"].value;
        var array = this["in"].array;

        if(!_.isArray(array)) {
		array = context.session[this["in"].array];
		if(!_.isArray(array)) {
			array = [ array ];
		}
	}
	if(array.indexOf(value)>=0) {
		return;
	}
	return { message: "Element was not found in the array.", value: value, array: array };
}
