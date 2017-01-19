var _ = require("lodash");
var path = require("path");
var fs = require("fs");

function is_javascript(filename) {
	return path.extname(filename) == ".js";
}

function find_include_files(include_path, ignores) {
	var js_files_in_folder = _.filter( // Find all javascript files in the folder
		fs.readdirSync(include_path),
		is_javascript
	);
	return _.difference( // Remove ignores (and the including script itself)
		js_files_in_folder,
		_.union(ignores, [include_path])
	);
}

module.exports = function (include_path, ignores) {
	ignores = _.castArray(ignores);

	var includes = find_include_files(include_path, ignores);
	var result = {};
	_.forEach(includes, function (include) {
		result[path.basename(include, ".js")] = require(include_path + "/" + include);
	});
	return result;
};