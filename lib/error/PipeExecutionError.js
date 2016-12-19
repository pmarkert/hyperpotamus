function PipeExecutionError(pipe, error) {
    this.name = "PipeExecutionError";
    this.message = `\n  Pipe: ${pipe}\n  Error: ${error}`;
    Error.captureStackTrace(this, PipeExecutionError);
}
PipeExecutionError.prototype = Object.create(Error.prototype);
PipeExecutionError.prototype.constructor = PipeExecutionError;
module.exports = PipeExecutionError;
