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

module.exports.process = function (context, callback) {
	if (!context.httpClient) {
		module.exports.logger.trace("Initializing new httpClient for this session");
		context.httpClient = require("request");
		// TODO - Allow pre-assigned cookie-jar?
		context.httpClient = context.httpClient.defaults({ jar: context.httpClient.jar() });
	}

	// Now apply default values from "request_defaults" session object
	var request = {};
	_.merge(request, default_useragent, context.session["request_defaults"], this.request);
	try {
		request = context.interpolate(request, context.session);
	}
	catch (err) {
		return callback("Error interpolating request - " + err);
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
	module.exports.logger.trace("About to send request " + JSON.stringify(request, null, 2));
	var request_started = new Date();
	var self = this;
	context.httpClient(request, function (err, response, buffer) {
		var request_timing = new Date() - request_started;
		var body;
		if( _.isString(buffer)) {
			body = buffer;
		}
		else if(_.isBuffer(buffer)) {
			body = buffer.toString();
		}
		else if(_.isObject(buffer)) {
			body = JSON.stringify(buffer, null, 2);
		}
		else {
			body = "";
		}

		if (response && response.statusCode) {
			module.exports.logger.info("Received response in " + request_timing.toString() + " msec. Status: " + response.statusCode + " Content-Length: " + body.length.toString());
		}
		module.exports.logger.trace("Response is " + JSON.stringify(response));
		if (err) {
			debugger;
			err.response = response;
			module.exports.logger.warn("Response returned with error" + err);
			return callback(err, context);
		}
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
			return callback();
		}

		// Save previous values for response so they can be reset after processing.
		var existing_response = context.response;
		var existing_buffer = context.buffer;
		var existing_body = context.body;

		context.response = response;
		context.buffer = buffer;
		context.body = body;

		context.process_action(response_actions, context, function (err) {
			// Reset the previous response values in the context
			context.response = existing_response;
			context.buffer = existing_buffer;
			context.body = existing_body;
			callback(err);
		});
	});
}
