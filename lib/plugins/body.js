var _ = require("lodash");
var verror = require("verror");
module.exports.safe = true;

/*
 Purpose:
 Stores the body of the current HTTP response under the specified key

 Example:
 body: key
 */

module.exports.process = function (context) {
	if (_.isNil(context.response)) {
		throw new verror.VError({ name: "InvalidActionPlacement.body" }, "The 'body' action is only valid for use within the 'response' of a 'request' action.");
	}
	if(!_.isString(this.body)) {
		throw new verror.VError({ name: "InvalidActionValue.body" }, "The .body property is expected to be a session key (string) in which to store the body contents.");
	}
	context.session[this.body] = context.body;
};