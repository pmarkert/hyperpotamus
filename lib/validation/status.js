var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.name = "status";

module.exports.handles = function(validation) {
	return !!(validation.status);
}

module.exports.process = function(context, callback) {
        var err;
        if(context.validation.status !== context.response.statusCode) {
                err = "Response status code did not match";
        }
        return callback(err, context.validation.status, context.response.statusCode);
}
