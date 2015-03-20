var _ = require("underscore");
var regex_helper = require("./helpers/regex");

module.exports.name = "delay";

module.exports.safe = true;

module.exports.handles = function(action) {
        return _.isObject(action) && !!(action.delay);
}

module.exports.process = function(context, callback) {
	if(this.debugger) debugger;
        var err;
        var compare = parseInt(this.delay);
	if(_.isNaN(compare)) { 
		err = "Delay value must be a number." 
		return callback(err, compare, this.delay);
	};
	setTimeout(callback, compare);
}
