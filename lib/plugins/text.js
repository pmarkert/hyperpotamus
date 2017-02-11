module.exports.safe = true;

var _ = require("lodash");
var regex_helper = require("./helpers/regex");

module.exports.normalize = function (action) {
	if (_.isString(action)) {
		if (!regex_helper.extract_regex(action)) {
			return { text: action };
		}
	}
};

module.exports.process = function (context) {
	if (_.isNil(context.response)) {
		throw new verror.VError({
			name: "InvalidActionPlacement.text",
			info: {
				path: this.path + ".text"
			}
		}, "The .text action is only valid for use within the response of a .request action.");
	}
	if (!_.isString(this.text)) {
		throw new verror.VError({
			name: "InvalidActionValue.text",
			info: {
				path: this.path + ".text"
			}
		}, "The .text property must be a string value");
	}
	if (context.body.toString().indexOf(this.text) == -1) {
		throw new verror.VError({
			name: "TextNotFoundInResponse",
			info: {
				path: this.path + ".text",
				text: this.text,
				body: context.body
			}
		}, "Response body did not contain expected text");
	}
};
