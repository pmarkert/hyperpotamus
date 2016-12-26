function InvalidPluginError(message, plugin) {
    this.name = "InvalidPluginError";
    this.message = `\n  ${message}\n  plugin: ${plugin.name}`;
    Error.captureStackTrace(this, InvalidPluginError);
}
InvalidPluginError.prototype = Object.create(Error.prototype);
InvalidPluginError.prototype.constructor = InvalidPluginError;
module.exports = InvalidPluginError;
