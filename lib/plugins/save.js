var _ = require("underscore");
var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");

module.exports.name = "save";

module.exports.safe = false;

module.exports.handles = function(action) {
	return _.isString(action.save);
}

module.exports.process = function(action, context, callback) {
	if(action.debugger) debugger;
	var filename = action.save;
	var file_path = path.resolve(filename);
	mkdirp(path.dirname(filename), function(err) {
		if(err) return callback(err);
		fs.writeFile(filename, context.buffer, callback);
	});
}
