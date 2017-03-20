var _ = require("lodash");
var exec = require("child_process").exec;
var verror = require("verror");

module.exports.safe = false;

module.exports.normalize = function (action) {
	if (_.isString(action.exec)) {
		action.exec = { command: action.exec };
		return action;
	}
};

module.exports.process = function (context, callback) {
	exec(this.exec.command, this.exec.options, (err, stdout, stderr) => {
		stdout = _.trimEnd(stdout, "\n");
		stderr = _.trimEnd(stderr, "\n");
		if (this.exec.stdout) {
			context.setSessionValue(this.exec.stdout, stdout);
		}
		else {
			context.options.emit(stdout);
		}
		if (this.exec.stderr) {
			context.setSessionValue(this.exec.stderr, stderr);
		}
		else {
			context.options.emit(stderr);
		}
		if (err) {
			return callback(new verror.VError({
				name: "ProcessExecutionError",
				info: {
					cause: err,
					command: this.exec.command,
					stderr,
					stdout
				}
			}, "Error executing external process - %s", err));
		}
		else {
			return callback(err);
		}
	});
};
