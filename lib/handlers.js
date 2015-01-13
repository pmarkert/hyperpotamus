var _ = require("underscore");
var fs = require("fs");
var path = require("path");

// TODO - add validation.set to explictly set values

var action_handler_folder = path.join(__dirname, "action_handlers");

function readJsFiles(folder) {
	var files = fs.readdirSync(folder);
	var jsfiles = _.filter(files, function(file) { return path.extname(file)===".js"; });
	return _.map(jsfiles, function(file) { return require(path.join(folder, file)); } );
}

module.exports = function(options) {
	if(!options) options = {};
	return readJsFiles(options.action_handler_folder || action_handler_folder)
}
