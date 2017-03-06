module.exports.safe = true;

var _ = require("lodash");
var verror = require("verror");

module.exports.process = function (context) {
	if (!_.isString(this.text)) {
		throw new verror.VError({
			name: "InvalidActionValue.text",
			info: {
				path: this.path + ".text"
			}
		}, "The .text property must be a string value");
	}
	var target = this.target;
	if(_.isNil(target)) {
		var response = context.getSessionValue("hyperpotamus.response", null, undefined);
		if (_.isNil(response)) {
			throw new verror.VError({
				name: "InvalidActionPlacement.text",
				info: {
					path: this.path + ".text"
				}
			}, "If the text action is not used within the .response of a request action, then an explicit .target must be specified.");
		}
		target = response.body;
	}
	if (_.isNil(target)) {
		throw new verror.VError({
			name: "TargetIsNull",
			info: {
				path: this.path + ".target"
			}
		}, "The target value is null");
	}
	target = target.toString();
	if (target.indexOf(this.text) == -1) {
		throw new verror.VError({
			name: "TextNotFound",
			info: {
				path: this.path + ".text",
				text: this.text,
				target
			}
		}, "Target did not contain expected text");
	}
};
