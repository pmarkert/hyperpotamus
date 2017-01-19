module.exports.safe = true;

/*
Purpose:
  Logs text back to the logging stream at the specified level.

Examples:
  log: 
    message: Success
    level: INFO # TRACE, DEBUG, INFO, WARN, ERROR, FATAL
------
  log: Success message # default logging level is info
*/

var _ = require("lodash");
var logging = require("../logging");

module.exports.normalize = function(action) {
	if(_.has(action, "log")) {
		if(_.isString(action.log)) {
			action.log = { message: action.log, level: "INFO" };
			return action;
		}
	}
};

// eslint-disable-next-line no-unused-vars
module.exports.process = function (context) {
	var level;
	if(_.isString(this.log.level)) {
		level = _.find(_.values(logging.levels), { 1: this.log.level.toUpperCase() });
		if(!level) {
			module.exports.logger.error("Could not match logging level - " + this.log.level + " to log message - " + this.log.message);
			return;
		}
	}
	else if(_.isNumber(this.log.level)) {
		level = _.values(logging.levels)[this.log.level];
		if(!level) {
			module.exports.logger.error("Could not match logging level - " + this.log.level + " to log message - " + this.log.message);
			return;
		}
	}
	module.exports.logger.log(level, this.log.message);
};
