module.exports.safe = true;

/*
Purpose:
  Sleeps (delays) for a specified number of milliseconds. This can be used to simulate more realistic
  user traffic. Can be combined with the "random" pipe for a non-deterministic pause.

Example:
  delay: 500
*/

var _ = require("underscore");

module.exports.process = function (context, callback) {
	var compare = parseInt(this.delay);
	if (_.isNaN(compare)) {
		return callback({ message: "Delay value must be a number.", value: this.delay });
	}
	setTimeout(callback, compare);
};
