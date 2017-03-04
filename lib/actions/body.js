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
	var response = context.getSessionValue("hyperpotamus.response", null, undefined);
	if (_.isNil(response)) {
		throw new verror.VError({
			name: "InvalidActionPlacement.body",
			info: {
				path: this.path + ".body"
			}
		}, "The .body action is only valid for use within the response of a .request action.");
	}
	if (!_.isString(this.body)) {
		throw new verror.VError({ 
			name: "InvalidActionValue.body", 
			info: { 
				path: this.path + ".body" 
			} 
		}, "The .body property is expected to be a session key (string)");
	}
	if(_.isNil(response.body)) {
		throw new verror.VError({
			name: "NullResponseBody",
			info: {
				path: this.path + ".body"
			}
		}, "The response.body property was null.");
	}
	var response_body = response.body; //_.isPlainObject(response.body) ? JSON.stringify(response.body, null, 2) : response.body.toString();
	context.setSessionValue(this.body, response_body);
};