var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.name = "status";

module.exports.safe = true;

module.exports.normalize = function(action) {
	if(!_.isNumber(action)) return;
	return { status : action };
}

module.exports.handles = function(action) {
	return _.isNumber(action.status);
}

module.exports.process = function(action, context, callback) {
        var err;
        if(action.status !== context.response.statusCode) {
                err = "Response status code did not match";
        }
        return callback(err, action.status, context.response.statusCode);
}
