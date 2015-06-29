var _ = require("underscore");
var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");
var util = require("util");
var logger = require("../logging").logger("hyperpotamus.plugins.save");

module.exports.name = "save";

module.exports.safe = false;

module.exports.handles = function(action) {
	return _.isString(action.save);
}

module.exports.process = function(context, callback) {
	var self = this;
	if(this.debugger) debugger;
	var filename = this.save;
	var file_path = path.resolve(filename);
	mkdirp(path.dirname(filename), function(err) {
		if(err) return callback(err);
		var content = self.content || context.buffer;
		fs.writeFile(filename, content, callback);
	});
}
