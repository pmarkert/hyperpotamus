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
	if(this.aws.service == "DynamoDB.DocumentClient") {
		return dynamo_documentclient.apply(this, [ context, callback ]);
	}
	var service = new AWS[this.aws.service](this.aws.config);
	var self = this;
	service.makeRequest(this.aws.invoke, this.aws.params, function (err, data) {
		if (self.debugger) {
			debugger; // eslint-disable-line no-debugger
		}
		if (self.aws.result) {
			context.session[self.aws.result] = data;
		}
		callback(err);
	});
};

function dynamo_documentclient(context, callback) {
	var service = new AWS.DynamoDB.DocumentClient(this.aws.config);
	var self = this;
	service[this.aws.invoke](this.aws.params, function(err, data) {
		if (self.debugger) {
			debugger; // eslint-disable-line no-debugger
		}
		if (self.aws.result) {
			context.session[self.aws.result] = data;
		}
		callback(err);
	});
}
