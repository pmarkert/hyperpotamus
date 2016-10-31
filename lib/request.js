var _ = require("lodash");
var querystring = require("querystring");
var logger = require("./logging").logger("hyperpotamus.request");

module.exports = function (request, context, callback) {
	if (!request) {
		logger.trace("Request is null, so skipping request phase");
		// Populating context with empty data
		return callback(null, { statusCode: 0, headers: {} }, new Buffer(""));
	}

	if (!context.httpClient) {
		logger.trace("Initializing new httpClient for this session");
		context.httpClient = require("request");
		context.httpClient = context.httpClient.defaults({ jar: context.httpClient.jar() });
	}

	// Interpolate any request parameters
	if (request.json_item) {
		request.json = context.session[request.json_item];
		delete(request.json_item);
	}
	try {
		request = context.interpolate(request, context.session);
	}
	catch (err) {
		return callback("Error during interpolation - " + err);
	}

	if (request.agentOptions && request.agentOptions.socksHost) {
		logger.trace("Setting up socks proxy for request.");
		request.agentClass = new require("socks5-http-client/lib/Agent");
	}

	if (context.options.before_request) {
		logger.trace("Invoking before_request");
		context.options.before_request(request);
	}

	logger.info("About to send request " + (request.method || "GET") + " " + request.url);
	context.request_started = new Date();
	context.httpClient(request, callback);
}
