function InvalidScriptError(message) {
    this.name = "InvalidScriptError";
    this.message = `${message}`;
}
InvalidScriptError.prototype = Object.create(Error.prototype);
InvalidScriptError.prototype.constructor = InvalidScriptError;
module.exports = InvalidScriptError;
