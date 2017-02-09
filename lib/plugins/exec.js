var exec = require("child_process").exec;
module.exports.safe = false;

module.exports.process = function (context, callback) {
	var self = this;
	exec(this.exec.command, this.exec.options, function (err, stdout, stderr) {
		if (err) {
			return callback(err);
		}
		// TODO - what do we do with stderr?
		if (self.exec.stdout) {
			context.session[self.exec.stdout] = stdout.replace(/^\s+|\s+$/g, "");
		}
		if (self.exec.stderr) {
			context.session[self.exec.stderr] = stderr.replace(/^\s+|\s+$/g, "");
		}
		callback();
	});
};
