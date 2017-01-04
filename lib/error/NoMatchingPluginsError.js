function NoMatchingPluginsError(candidate_properties) {
    this.name = "NoMatchingPluginsError";
    this.message = `No suitable plugin was found to process the action.\n Action properties: ${candidate_properties.join(',')}`;
    Error.captureStackTrace(this, NoMatchingPluginsError);
}
NoMatchingPluginsError.prototype = Object.create(Error.prototype);
NoMatchingPluginsError.prototype.constructor = NoMatchingPluginsError;
module.exports = NoMatchingPluginsError;
