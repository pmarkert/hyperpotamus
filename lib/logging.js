var _ = require("underscore");
var moment = require("moment");
var colors = require("colors");

var levels = module.exports.levels = {
	none  : [ 0, "NONE", colors.reset ],
	fatal : [ 1, "FATAL", colors.magenta ],
	error : [ 2, "ERROR", colors.red ],
	warn  : [ 3, "WARN", colors.yellow ],
	info  : [ 4, "INFO", colors.green ],
	debug : [ 5, "DEBUG", colors.cyan ],
	trace : [ 6, "TRACE", colors.blue ]
}

var logging_level = levels.none;

module.exports.logger = function(logger_name) {
	return {
		trace : _.partial(log, logger_name, levels.trace),
		debug : _.partial(log, logger_name, levels.debug),
		info : _.partial(log, logger_name, levels.info),
		warn : _.partial(log, logger_name, levels.warn),
		error : _.partial(log, logger_name, levels.error),
		fatal : _.partial(log, logger_name, levels.fatal),
		log : _.partial(log, logger_name)
	}
}

module.exports.set_log_function = function(log_function) {
	log_func = log_function;
}


function colored_console(logger_name, level, message) {
	console.log(level[2]("[" + moment().format() + "] [" + logger_name + "] [" + level[1] + "] - ") + message);
}

var log_func = colored_console;

function log(logger_name, level, message) {
	if(level<=logging_level) {
		log_func(logger_name, level, message);
	}
}

module.exports.set_level = function(level) {
	if(_.isNumber(level)) {
		logging_level = _.find(levels, function(p_level) { return p_level[0] === level });
	}
	else if(_.isString(level)) {
		logging_level = _.find(levels, function(p_level) { return p_level[1] === level });
	}
	else {
		logging_level = _.contains(levels, level) ? level : null;
	}
	if(logging_level==null) { 
		console.log("Invalid logging level set - " + level + " no logging will be performed.");
		logging_level = levels.none;
	}
}
