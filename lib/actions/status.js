module.exports.safe = true;

/*
Purpose:
  Validates that the HTTP Status code matches the expected value
*/
var _ = require("lodash");
var verror = require("verror");

module.exports.normalize = function (action) {
	if (_.isNumber(action)) {
		return { status: action };
	}
};

module.exports.process = function (context) {
	var response = context.getSessionValue("hyperpotamus.response", null, undefined);
	if (_.isNil(response)) {
		throw new verror.VError({
			name: "InvalidActionPlacement.status",
			info: {
				path: this.path + ".status"
			}
		}, "The status action is only valid for use within the .response of a request action.");
	}
	if (this.status !== response.statusCode) {
		throw new verror.VError({
			name: "StatusCodeMismatch",
			info: {
				expected: this.status,
				actual: response.statusCode
			}
		}, `Response status code did not match. Expected ${this.status}, but received ${context.response.statusCode}`);
	}
};
