var exec = require("child_process").exec;
module.exports.safe = false;

module.exports.process = function (context, callback) {
	exec(this.exec.command, this.exec.options, (err, stdout, stderr) => {
		if (this.exec.stdout) {
			context.setSessionValue(this.exec.stdout, stdout);//.replace(/^\s+|\s+$/g, ""));
		}
		if (this.exec.stderr) {
			context.setSessionValue(this.exec.stderr, stderr);//.replace(/^\s+|\s+$/g, ""));
		}
		return callback(err);
	});
};
