var hyperpotamus_version = require("../../package.json").version;
var verror = require("verror");
var semver = require("semver");

module.exports.process = function process() {
	if (!semver.satisfies(hyperpotamus_version, this.version, true)) {
		throw new verror.VError({
			name: "VersionMismatchError",
			info: {
				current_version: hyperpotamus_version,
				required_version: this.version,
				path: `${this.path}.version`
			}
		}, "This script is not compatible with the verison of hyperpotamus that you are running.\n" +
				"\n" + 
			"Current version: %s\n" +
			"Required version: %s\n" +
			"\n" + 
			"To update to the latest version use:\n  npm update -g hyperpotamus\nto update to a specific version use:\n  npm update -g hyperpotamus@{VERSION NUMBER}", hyperpotamus_version, this.version);
	}
}