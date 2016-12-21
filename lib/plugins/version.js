var _ = require("lodash");
var semver = require("semver");

module.exports.safe = true;

/*
- load:
    session_key: filename
*/

module.exports.process = function (context) {
	// Check for version specifier
	var version = require("../../package.json").version;
	if (!semver.satisfies(version, this.version)) {
		throw { message: "Script requires hyperpotamus version: " + this.version + ", current version " + version + " does not meet this requirement." };
	}
}
