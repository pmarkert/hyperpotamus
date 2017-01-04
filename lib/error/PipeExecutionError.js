function PipeExecutionError(pipe, error) {
    this.name = "PipeExecutionError";
    this.message = `${error}\n Pipe: ${pipe}`;
    Error.captureStackTrace(this, PipeExecutionError);
}
PipeExecutionError.prototype = Object.create(Error.prototype);
PipeExecutionError.prototype.constructor = PipeExecutionError;
module.exports = PipeExecutionError;
