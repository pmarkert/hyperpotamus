function InvalidScriptError(message) {
    this.name = "InvalidScriptError";
    this.message = `\n  ${message}`;
    Error.captureStackTrace(this, InvalidScriptError);
}
InvalidScriptError.prototype = Object.create(Error.prototype);
InvalidScriptError.prototype.constructor = InvalidScriptError;
module.exports = InvalidScriptError;
