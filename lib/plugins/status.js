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
	if (this.status !== context.response.statusCode) {
		throw new verror.VError({
			name: "StatusCodeMismatch",
			info: {
				expected: this.status,
				actual: context.response.statusCode,
				response: _.pick(context.response, [ "body", "response" ])
			}
		}, `Response status code did not match. Expected ${this.status}, but received ${context.response.statusCode}`);
	}
};
