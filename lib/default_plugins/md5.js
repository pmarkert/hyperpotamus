var _ = require("underscore");
var crypto = require("crypto");

module.exports.name = "md5";

module.exports.safe = true;

module.exports.handles = function(action) {
	return _.isString(action.md5);
}

module.exports.process = function(action, context, callback) {
	var md5 = crypto.createHash("MD5");
	md5.update(context.buffer);
	context.session[action.md5] = md5.digest("hex");
	callback();
}
