module.exports.safe = true;
module.exports.manual_interpolation = true;

/* 
Purpose:
  Executes an HTTP request, applying the current request_defaults.
  Executes any actions under the .response property on completion of the request. 

Syntax:
  - request:
      url: ...
      method: POST
    response:
      - action1
      - action2
*/

var _ = require("underscore");
var querystring = require("querystring");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "request")) {
		if(_.isString(action.request)) {
			module.exports.logger.trace("SHORTCUT: Request is a string so assuming it is the .url property.");
			action.request = { url : action.request };
		}
		action.request.headers = action.request.headers || {};

		// Alias socks properties to agentOptions
		if(_.has(action.request, "socks")) {
			action.request.agentOptions = action.request.agentOptions || {};
			action.request.agentOptions = _.defaults(action.request.agentOptions, action.request.socks);
			delete(action.request.socks);
		}

		// Move this to "apply defaults"
		if(!action.request.headers["user-agent"]) {
			action.request.headers["user-agent"] = require("../useragent");
		}

		if(_.has(action, "response")) {
			action.response = normalize_action(action.response);
		}
		return action;
	}
}

module.exports.process = function(context, callback) {
	if (!context.httpClient) {
		module.exports.logger.trace("Initializing new httpClient for this session");
		context.httpClient = require("request");
		// TODO - Allow pre-assigned cookie-jar?
		context.httpClient = context.httpClient.defaults({ jar: context.httpClient.jar() });
	}

	var request;
	try {
		request = context.interpolate(this.request, context.session);
	}
	catch (err) {
		return callback("Error interpolating request - " + err);
	}

	if (request.agentOptions && request.agentOptions.socksHost) {
		module.exports.logger.trace("Setting up socks proxy for request.");
		request.agentClass = new require("socks5-http-client/lib/Agent");
	}

	if (context.options.before_request) {
		module.exports.logger.trace("Invoking before_request");
		context.options.before_request(request);
	}

	module.exports.logger.info("About to send request " + (request.method || "GET") + " " + request.url);
	var request_started = new Date();
	var self = this;
	context.httpClient(request, function(err, response, buffer) {
		var request_timing = new Date() - request_started;

		context.response = response;
		context.buffer = buffer;
		context.body = buffer ? buffer.toString() : "";
		if(response && response.statusCode) {
			module.exports.logger.info("Received response in " + request_timing.toString() + " msec. Status: " + response.statusCode + " Content-Length: " + context.body.length.toString());
		}
		module.exports.logger.trace("Response is " + JSON.stringify(response));
		if (err) {
			err.response = response;
			module.exports.logger.warn("Response returned with error" + err);
			return context.options.done(err, context);
		}
		if (context.options.before_validate) {
			module.exports.logger.debug("About to invoke options.before_validate");
			context.options.before_validate(self, context);
		}
		if(_.has(self, "response")) {
			context.validate.process_action(self.response, context, callback);
		}
		else {
			callback();
		}
	});
}
