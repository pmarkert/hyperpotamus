module.exports.safe = false;

var AWS = require("aws-sdk");

module.exports.process = function (context, callback) {
	var service = new AWS[this.aws.service](this.aws.config);
	var self = this;
	service.makeRequest(this.aws.invoke, this.aws.params, function (err, data) {
		if (self.debugger) {
			debugger;
		}
		if (self.aws.result) {
			context.session[self.aws.result] = data
		}
		callback(err);
	});
}
