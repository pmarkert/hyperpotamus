var _ = require("lodash");
module.exports.safe = true;

/*
 Purpose:
 Stores the body of the current HTTP response under the specified key

 Example:
 body: key
 */

module.exports.process = function (context) {
	if(_.isNil(context.response)) {
		return { message: "This action is only valid when processing responses." };
	}
	context.session[this.body] = context.body;
}
