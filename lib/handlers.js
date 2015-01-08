var _ = require("underscore");
var async = require("async");
var fs = require("fs");
var path = require("path");

// TODO - add not: to negate a validation
// TODO - add validation.set to explictly set values

var response_handler_folder = path.join(__dirname, "response_handlers");

module.exports = function(options) {
	if(!options) options = {};
	var folder = options.response_handler_folder || response_handler_folder;
	var files = fs.readdirSync(response_handler_folder);
	var jsfiles = _.filter(files, function(file) { return path.extname(file)===".js"; });
	return _.map(jsfiles, function(file) { return require(path.join(response_handler_folder, file)); } );
}
