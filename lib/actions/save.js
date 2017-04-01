module.exports.safe = false;

/*
Purpose:
  Saves the HTTP body content (or the value of the .content property) to a file.
 */
var _ = require("lodash");
var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");
var Promise = require("bluebird");

module.exports.process = function (context) {
	var response = context.getSessionValue("hyperpotamus.response", null, undefined);
	if (_.isNil(response)) {
		throw new verror.VError({
			name: "InvalidActionPlacement.save",
			info: {
				path: this.path + ".save"
			}
		}, "The .save action is only valid for use within the response of a .request action.");
	}
	if (!_.isString(this.save)) {
		throw new verror.VError({
			name: "InvalidActionValue.save",
			info: {
				path: this.path + ".save"
			}
		}, "The .save property is expected to be a path (string)");
	}
	if (_.isNil(response.body)) {
		throw new verror.VError({
			name: "NullResponseBody",
			info: {
				path: this.path + ".save"
			}
		}, "The response.body property was null.");
	}
	return Promise.promisify(mkdirp)(path.dirname(this.save))
		.then(() => {
			return Promise.promisify(fs.writeFile)(this.save, response.body);
		});
};
