module.exports.safe = true;

/*
Purpose:
  Validates that the HTTP Status code matches the expected value
*/
var _ = require("lodash");

module.exports.normalize = function (action) {
	if (_.isNumber(action)) {
		return { status: action };
	}
}

module.exports.process = function (context) {
	var err;
	if (this.status !== context.response.statusCode) {
		throw { message: "Response status code did not match", expected: this.status, actual: context.response.statusCode };
	}
}
