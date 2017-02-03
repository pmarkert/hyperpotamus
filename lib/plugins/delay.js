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

// eslint-disable-next-line no-unused-vars
module.exports.process = function (context) {
	var delay = this.delay;
	var valid = true;
	if(!_.isInteger(delay)) {
		if(!_.isString(delay)) {
			valid = false;
		}
		else {
			if(!delay.match(/^\d+$/)) {
				valid = false;
			}
			else {
				delay = _.toInteger(delay);
			}
		}
	}
	if (delay < 0) {
		valid = false;
	}
	if(!valid) {
		throw new verror.VError({ name: "InvalidActionValue.delay" }, "Delay value must be a non-negative integer. Invalid value: %s", delay);
	}
	return Promise.delay(delay);
};
