var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.handles = function(validation) {
	return !!(validation.status);
}

module.exports.process = function(context) {
        var err;
        if(context.validation.status !== context.response.statusCode) {
                err = "Response status code did not match";
        }
        return context.callback(err, context.validation.status, context.response.statusCode);
}
