var _ = require("lodash");

function ActionProcessingError(err, action, context) {
    this.name = "ActionProcessingError";
    if(_.isString(err)) err = { message: err };
    this.action = err.action || action;
    this.context = err.context || context;
    this.stack = err.stack;
    this.message = `Error while processing action\n Error: ${err.message || err }\n Action: ${JSON.stringify(this.action, null, 2)}`;
}
ActionProcessingError.prototype = Object.create(Error.prototype);
ActionProcessingError.prototype.constructor = ActionProcessingError;
module.exports = ActionProcessingError;
