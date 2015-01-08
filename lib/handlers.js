var _ = require("underscore");
var fs = require("fs");
var path = require("path");

// TODO - add not: to negate a validation
// TODO - add validation.set to explictly set values

var action_handler_folder = path.join(__dirname, "action_handlers");

module.exports = function(options) {
	if(!options) options = {};
	var folder = options.action_handler_folder || action_handler_folder;
	var files = fs.readdirSync(action_handler_folder);
	var jsfiles = _.filter(files, function(file) { return path.extname(file)===".js"; });
	return _.map(jsfiles, function(file) { return require(path.join(action_handler_folder, file)); } );
}
