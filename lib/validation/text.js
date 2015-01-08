var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.handles = function(validation) {
	return !!(validation.text);
}

module.exports.process = function(context) {
        var err;
        var compare = interpolate(context.validation.text, context.session);
        if(context.body.indexOf(compare)==-1) {
                err = "Body did not match text";
        }
        return context.callback(err, compare, context.body);
}
