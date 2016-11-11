var exec = require("child_process").exec;
module.exports.safe = false;

module.exports.process = function(context, callback) {
	var self = this;
	exec(this.exec.command, this.exec.options, function(err, stdout, stderr) {
		// TODO - what do we do with stderr?
		if(self.exec.result) {
			context.session[self.exec.result] = stdout;
		}
		callback(err);
	});
}
