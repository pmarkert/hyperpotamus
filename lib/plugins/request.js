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

var _ = require("lodash");
var querystring = require("querystring");
var Promise = require("bluebird");
var yaml = require("../yaml.js");

var default_useragent = {
	headers: {
		"user-agent": require("../useragent")
	}
};

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "request")) {
		if (_.isString(action.request)) {
			module.exports.logger.trace("SHORTCUT: Request is a string so assuming it is the .url property.");
			action.request = { url: action.request };
		}

		if (_.has(action, "response")) {
			action.response = normalize_action(action.response);
		}
		return action;
	}
};

module.exports.process = function (context) {
	if (!context.httpClient) {
		module.exports.logger.trace("Initializing new httpClient for this session");
		context.httpClient = Promise.promisify(require("request"));
		// TODO - Allow pre-assigned cookie-jar?
		context.httpClient = context.httpClient.defaults({ jar: context.httpClient.jar() });
	}

	// Now apply default values from "request_defaults" session object
	var request = {};
	_.merge(request, default_useragent, context.session["request_defaults"], this.request);
	try {
		request = context.interpolate(request);
	}
	catch (err) {
		throw new Error("Interpolating request failed. Caused by:\n" + err);
	}

	// Alias socks properties to agentOptions
	if (_.has(request, "socks")) {
		request.agentOptions = request.agentOptions || {};
		request.agentOptions = _.defaults(request.agentOptions, request.socks);
		delete(request.socks);
	}

	if (request.agentOptions && request.agentOptions.socksHost) {
		module.exports.logger.trace("Setting up socks proxy for request.");
		request.agentClass = new require("socks5-http-client/lib/Agent");
	}

	if (context.before_request) {
		module.exports.logger.trace("Invoking before_request");
		context.before_request(request);
	}

	module.exports.logger.info("About to send request " + (request.method || "GET") + " " + request.url);
	module.exports.logger.trace("About to send request " + );
	var request_started = new Date();
	var self = this;
	request.simple = true;
	request.resolveWithFullResponse = true;
	return context.httpClient(request).then(response => {
		var request_timing = new Date() - request_started;
		var body;
		if( _.isString(response.body)) {
			body = response.body;
		}
		else if(_.isBuffer(response.body)) {
			body = response.body.toString();
		}
		else if(_.isObject(response.body)) {
			body = JSON.stringify(response.body, null, 2);
		}
		else {
			body = "";
		}

		if (response && response.statusCode) {
			module.exports.logger.info(`Received response in ${request_timing} msec. Status: ${response.statusCode} Content-Length: ${body.length}`);
		}
		module.exports.logger.trace("Response is " + JSON.stringify(response));
		if (context.before_validate) {
			module.exports.logger.debug("About to invoke options.before_validate");
			context.before_validate(self, context);
		}
		var response_actions = self.response;
		if (!response_actions) {
			response_actions = context.options.response_defaults;
		}
		if (!response_actions) {
			// No validation to be done
			return;
		}

		// Save previous values for response so they can be reset after processing.
		var existing_response = context.response;
		var existing_buffer = context.buffer;
		var existing_body = context.body;

		context.response = response;
		context.buffer = response.body;
		context.body = body;

		return context.process_action(response_actions, context).finally(() => {
			// Reset the previous response values in the context
			context.response = existing_response;
			context.buffer = existing_buffer;
			context.body = existing_body;
		});
	});
}
