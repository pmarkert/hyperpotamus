function NoMatchingPluginsError(candidate_properties) {
    this.name = "NoMatchingPluginsError";
    this.message = `\n  Action Properties: ${candidate_properties.join(',')}`;
    Error.captureStackTrace(this, NoMatchingPluginsError);
}
NoMatchingPluginsError.prototype = Object.create(Error.prototype);
NoMatchingPluginsError.prototype.constructor = NoMatchingPluginsError;
module.exports = NoMatchingPluginsError;
