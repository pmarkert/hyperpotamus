module.exports.safe = true;
module.exports.manual_interpolation = ["default_request_options"];

/* 
Purpose:
  Sets default options to be processed on a request. These values are deeply merged into future request objects. 

Syntax:
  - default_request_options:
      headers:
        header: value
*/

var _ = require("lodash");

module.exports.process = function (context) {
	module.exports.logger.trace("Overwriting hyperpotamus.default_request_options with " + JSON.stringify(this.default_request_options, null, 2));
	context.setSessionValue("hyperpotamus.default_request_options", this.default_request_options);
};
