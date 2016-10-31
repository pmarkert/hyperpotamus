module.exports.safe = false;

/*
Purpose:
  Saves the HTTP body content (or the value of the .content property) to a file.
 */
var _ = require("lodash");
var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");

module.exports.process = function (context, callback) {
	var self = this;
	var filename = this.save;
	mkdirp(path.dirname(filename), function (err) {
		if (err) {
			return callback(err);
		}
		var content = self.content || context.buffer;
		fs.writeFile(filename, content, callback);
	});
}
