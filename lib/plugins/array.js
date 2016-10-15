module.exports.name = "compare";
module.exports.safe = true;

var logger = require("../logging").logger("hyperpotamus.plugins." + module.exports.name);

/*
  - array: array_name || <%! array_reference %>
    push: <% value to append %>
    pop: variable name to store result
    unshift: <% value to insert %>
    shift: variable name to store result
*/

var _ = require("underscore");
module.exports.handles = function(action) {
	return _.has(action.array);
}

module.exports.process = function(context) {
	var array = this.array;
	if(_.isString(array)) {
		array = context.session[this.array];
	}
	if(!_.isArray(array)) {
		throw new Error("array must be an array name or array reference");
	}
	if(_.has(this.pop)) {
		if(!_.isString(this.pop)) {
			throw new Error("pop value must be the name of a key.");
		}
		context.session[this.pop] = array.pop();
	}
	if(_.has(this.shift)) {
		if(!_.isString(this.shift)) {
			throw new Error("shift value must be the name of a key.");
		}
		context.session[this.shift] = array.shift();
	}
	if(_.has(this.push)) {
		array.push(this.push);
	}
	if(_.has(this.unshift)) {
		array.unshift(this.unshift);
	}
}
