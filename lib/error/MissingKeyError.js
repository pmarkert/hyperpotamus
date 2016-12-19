function MissingKeyError(key, tag) {
    this.name = "MissingKeyError";
    this.message = `\n  Key: ${key}\n  Tag: ${tag}`;
    Error.captureStackTrace(this, MissingKeyError);
}
MissingKeyError.prototype = Object.create(Error.prototype);
MissingKeyError.prototype.constructor = MissingKeyError;
module.exports = MissingKeyError;
