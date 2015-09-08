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

module.exports.process = function(context) {
        var err;
        if(this.status !== context.response.statusCode) {
                return { message : "Response status code did not match", expected : this.status, actual : context.response.statusCode };
        }
}
