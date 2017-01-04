function VersionMismatchError(hyperpotamus_version, script_version) {
    this.name = "VersionMismatchError";
    this.message = `The current version of hyperpotamus does not satisfy the version requirements of this script.\n Script requires: v${script_version}\n Hyperpotamus version: v${hyperpotamus_version}`;
}
VersionMismatchError.prototype = Object.create(Error.prototype);
VersionMismatchError.prototype.constructor = VersionMismatchError;
module.exports = VersionMismatchError;
