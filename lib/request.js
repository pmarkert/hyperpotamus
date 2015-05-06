var _ = require("underscore");
var querystring = require("querystring");
var interpolate = require("./interpolate");
var httpClient = require("request");
var logger = require("./logging").logger("hyperpotamus.request");

module.exports = function(request, context, callback) {
	if(!context.defaults.jar) {
		logger.trace("Initializing new cookie jar for this session");
		context.defaults.jar = httpClient.jar();
	}

	// Interpolate any request parameters
	request = interpolate(request, context.session);

	if(!request.url) {
		logger.debug("Request has no url, so treating as a null request");
		// Populating context with empty data
		return callback(null, { statusCode: 0, headers: {} }, new Buffer(""));
	}

	if(request.socks || context.defaults.socks) {
		logger.info("Setting up socks proxy for request.");
		request.agentClass = new require("socks5-http-client/lib/Agent");
		request.agentOptions = _.defaults(request.agentOptions || {}, request.socks, context.defaults.socks);
	}

	if(context.options.before_request) {
		logger.trace("Invoking before_request");
		context.options.before_request(request);
	}

        logger.debug("About to send request to " + request.url);
	context.request_started = new Date();
	var httpRequest = httpClient.defaults(context.defaults)(request, callback);
}
