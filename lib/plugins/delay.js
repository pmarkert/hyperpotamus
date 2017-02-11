module.exports.safe = true;

/*
Purpose:
  Sleeps (delays) for a specified number of milliseconds. This can be used to simulate more realistic
  user traffic. Can be combined with the "random" pipe for a non-deterministic pause.

Example:
  delay: 500
*/

var _ = require("lodash");
var verror = require("verror");
var Promise = require("bluebird");

module.exports.process = function () {
	var delay = this.delay;
	if (!_.isInteger(delay) || delay < 0) {
		throw new verror.VError({
			name: "InvalidActionValue.delay",
			info: {
				path: this.path + ".delay"
			}
		}, "Delay value must be a non-negative integer. Invalid value: %s", delay);
	}
	return Promise.delay(delay);
};
