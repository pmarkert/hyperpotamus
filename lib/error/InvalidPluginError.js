function InvalidPluginError(message, plugin) {
    this.name = "InvalidPluginError";
    this.message = `${message}\n Plugin: ${plugin.name}`;
}
InvalidPluginError.prototype = Object.create(Error.prototype);
InvalidPluginError.prototype.constructor = InvalidPluginError;
module.exports = InvalidPluginError;
