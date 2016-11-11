var _ = require("lodash");
var yaml = require("js-yaml");
var fs = require("fs");
var async = require("async");

module.exports.safe = false;

/*
- load:
    session_key: filename
*/

module.exports.process = function(context, done) {
	var self = this;
	async.each(_.keys(this.load), function(key, callback) {
		fs.readFile(self.load[key], "utf-8", function(err, content) {
			if(!err) {
				context.session[key] = yaml.load(script_text);
			}
			callback(err);
		});
	}, done);
}
