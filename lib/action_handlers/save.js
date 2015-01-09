var interpolate = require("../interpolate");
var _ = require("underscore");
var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");

module.exports.name = "save";

module.exports.handles = function(action) {
	return _.isString(action.save);
}

module.exports.process = function(action, context, callback) {
	var filename = interpolate(action.save, context.session);
	mkdirp(path.dirname(filename), function(err) {
		if(err) return callback(err);
		fs.writeFile(filename, context.buffer, callback);
	});
}
