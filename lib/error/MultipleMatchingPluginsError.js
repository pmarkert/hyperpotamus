function MultipleMatchingPluginsError(candidate_properties, matching_plugins) {
    this.name = "MultipleMatchingPluginsError";
    this.message = `Multiple matching plugins were found to process the action.\n Action properties: ${candidate_properties.join(',')}\n Matching plugins: ${matching_plugins.join(',')}`;
}
MultipleMatchingPluginsError.prototype = Object.create(Error.prototype);
MultipleMatchingPluginsError.prototype.constructor = MultipleMatchingPluginsError;
module.exports = MultipleMatchingPluginsError;
