var _ = require("lodash");
var verror = require("verror");
module.exports.safe = true;
var curlify = require("request-as-curl");

/*
 Purpose:
 Stores the body of the current HTTP response under the specified key

 Example:
 body: key
 */

module.exports.process = function (context) {
	if (_.isNil(context.response)) {
		throw new verror.VError({
			name: "InvalidActionPlacement.curl",
			info: {
				path: this.path + ".curl"
			}
		}, "The .curl action is only valid for use within the response of a .request action.");
	}
	if (!_.isString(this.curl)) {
		throw new verror.VError({ 
			name: "InvalidActionValue.curl", 
			info: { 
				path: this.path + ".curl" 
			} 
		}, "The .curl property is expected to be a session key (string) in which to store the curl contents.");
	}
	context.session[this.curl] = curlify(context.response.request.req, context.response.request.body);
};
