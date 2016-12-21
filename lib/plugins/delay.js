module.exports.safe = true;

/*
Purpose:
  Sleeps (delays) for a specified number of milliseconds. This can be used to simulate more realistic
  user traffic. Can be combined with the "random" pipe for a non-deterministic pause.

Example:
  delay: 500
*/

var _ = require("lodash");

module.exports.process = function (context, callback) {
	var delay = parseInt(this.delay);
	if (_.isNaN(delay)) {
		return callback({ message: "Delay value must be a number - Invalid value: " + this.delay });
	}
	setTimeout(callback, delay);
};
