module.exports.name = "delay";
module.exports.safe = true;

var logger = require("../logging").logger("hyperpotamus.plugins." + module.exports.name);

/*
Purpose:
  Sleeps (delays) for a specified number of milliseconds. This can be used to simulate more realistic
  user traffic. 

Example:
  delay: 500
*/

/*
Purpose:
  Sleeps (delays) for a specified number of milliseconds. This can be used to simulate more realistic
  user traffic. 

Example:
  delay: 500
*/

var _ = require("underscore");
var regex_helper = require("./helpers/regex");

module.exports.handles = function(action) {
        return _.isObject(action) && !!(action.delay);
}

module.exports.process = function(context, callback) {
        var compare = parseInt(this.delay);
	if(_.isNaN(compare)) { 
		return callback({ message : "Delay value must be a number.", value: this.delay });
	};
	setTimeout(callback, compare);
}
