function UnsafePluginError(plugin) {
    this.name = "UnsafePluginError";
    this.message = `\n  Plugin: ${plugin} cannot be used in safemode.`;
    Error.captureStackTrace(this, UnsafePluginError);
}
UnsafePluginError.prototype = Object.create(Error.prototype);
UnsafePluginError.prototype.constructor = UnsafePluginError;
module.exports = UnsafePluginError;
