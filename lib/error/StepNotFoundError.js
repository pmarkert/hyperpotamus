function StepNotFoundError(target_step) {
    this.name = "StepNotFoundError";
    this.message = "Target step could not be found.\n Step: " + target_step;
    Error.captureStackTrace(this, StepNotFoundError);
}
StepNotFoundError.prototype = Object.create(Error.prototype);
StepNotFoundError.prototype.constructor = StepNotFoundError;
module.exports = StepNotFoundError;
