module.exports.safe = true;

/*
Purpose:
  Sets values in the session.
*/
var _ = require("lodash");

module.exports.process = function(context) {
	for(var key in this.set) {
		context.session[key] = this.set[key];
	}
}
