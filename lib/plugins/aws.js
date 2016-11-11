var _ = require("lodash");
var AWS;

module.exports.safe = false;
module.exports.normalize = function normalize(action) {
	if(_.has(action, "aws")) {
		try {
			AWS = require("aws-sdk");
		}
		catch(err) {
			throw new Error("This action requires the aws-sdk module to be installed.");
		}
		return action;
	}
};

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
