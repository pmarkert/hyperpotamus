var AWS = require("aws-sdk");
var _ = require("lodash");
var verror = require("verror");

module.exports.safe = false;

module.exports.normalize = function (action, normalize_action, path) {
	// false => { fail }
	if (_.has(action, "aws")) {
		if (_.has(action, "aws.invoke")) {
      action.aws.operation = action.aws.invoke;
      delete(action.invoke);
    }
		return action;
	}
}


module.exports.process = function (context, callback) {
	var self = this;
	if (this.aws.service == "DynamoDB.DocumentClient") {
		return dynamo_documentclient.apply(self, [context, callback]);
	}
	var ServiceHandler = AWS[self.aws.service];
  if(ServiceHandler==null) {
			throw new verror.VError({
				name: "ActionServiceError.aws",
				info: {
					path: self.path + ".service",
          service: self.aws.service
				}
			}, "Service " + self.service + " not found on AWS library.");
  }
  service = new ServiceHandler(self.aws.config);
  if(!service.api.operations[self.aws.operation]) {
			throw new verror.VError({
				name: "ActionServiceError.aws",
				info: {
					path: self.path + ".operation",
          service: self.aws.service,
          operation: self.aws.operation
				}
			}, "Operation " + self.aws.operation + " not found on " + self.aws.service + " service.");
  }
	service.makeRequest(self.aws.operation, self.aws.params, function (err, data) {
		if (self.debugger) {
			debugger; // eslint-disable-line no-debugger
		}
		if (self.aws.result) {
			context.setSessionValue(self.aws.result, data);
		}
		callback(err);
	});
};

function dynamo_documentclient(context, callback) {
	var service = new AWS.DynamoDB.DocumentClient(this.aws.config);
	var self = this;
	service[this.aws.invoke](this.aws.params, function (err, data) {
		if (self.debugger) {
			debugger; // eslint-disable-line no-debugger
		}
		if (self.aws.result) {
			context.setSessionValue(self.aws.result, data);
		}
		callback(err);
	});
}
