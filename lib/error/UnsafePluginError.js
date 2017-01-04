function UnsafePluginError(plugin) {
    this.name = "UnsafePluginError";
    this.message = `Unsafe plugin cannot be used in safe-mode\n Plugin: ${plugin}`;
}
UnsafePluginError.prototype = Object.create(Error.prototype);
UnsafePluginError.prototype.constructor = UnsafePluginError;
module.exports = UnsafePluginError;
