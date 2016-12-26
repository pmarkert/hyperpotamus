function NoMatchingPluginsError(candidate_properties, matching_plugin_names) {
    this.name = "NoMatchingPluginsError";
    this.message = `\n  Action Properties: ${candidate_properties.join(',')}\n  Matching Plugins: ${matching_plugin_names.join(',')}`;
    Error.captureStackTrace(this, NoMatchingPluginsError);
}
NoMatchingPluginsError.prototype = Object.create(Error.prototype);
NoMatchingPluginsError.prototype.constructor = NoMatchingPluginsError;
module.exports = NoMatchingPluginsError;
