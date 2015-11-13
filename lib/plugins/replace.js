var _ = require("underscore");

module.exports.name = "replace";
module.exports.safe = true;

/* 
Purpose:
  Replaces one substring inside of a value with another

Examples:
  replace: key
  match: find
  replacement: <% value_to_replace %>
*/

module.exports = { 
	handles: handles,
	process: process
}

function handles(action) {
	return !_.isUndefined(action.replace) && !_.isUndefined(action.match) && !_.isUndefined(action.replacement);
}

function process(context) {
	if(_.isArray(context.session[this.replace])) {
		for(var i=0;i<context.session[this.replace].length;i++) {
			context.session[this.replace][i] = context.session[this.replace][i].replace(this.match, this.replacement);
		}
	}
	else {
		context.session[this.replace] = context.session[this.replace].replace(this.match, this.replacement);
	}
}
