var _ = require("underscore");

module.exports.name = "increment";
module.exports.safe = true;

/* 
Purpose:
  Increments (adds or subtracts) a value to the specified session variables

Examples:
  increment:
   value: 1
   other_value: <% increment_by %>
   reduce: -2
=====
  increment: jump_key
=====
  increment: [ key1, key2 ]
  by: 1
*/

module.exports = { 
	handles: handles,
	process: process
}

function handles(action) {
	return _.isObject(action.increment);
}

function process(context) {
	if(this.debugger) debugger;
	for(var key in this.increment) {
		context.session[key] = (parseInt(context.session[key]) + parseInt(this.increment[key])).toString();
	}
}
