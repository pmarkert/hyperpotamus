var _ = require("underscore");
var fs = require("fs");
var path = require("path");

// TODO - add validation.set to explictly set values

var action_handler_folder = path.join(__dirname, "action_handlers");

function readJsFiles(folder) {
	folder = path.resolve(folder);
	if(!fs.existsSync(folder)) throw new Error("Folder does not exist - " + folder);
	var files = fs.readdirSync(folder);
	var jsfiles = _.filter(files, function(file) { return path.extname(file)===".js"; });
	return _.map(jsfiles, function(file) { return require(path.join(folder, file)); } );
}

module.exports = function(folder) {
	return readJsFiles(folder || action_handler_folder)
}
