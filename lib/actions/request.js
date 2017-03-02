module.exports.safe = true;
module.exports.manual_interpolation = ["response"];

/* 
Purpose:
  Executes an HTTP request, applying the current default_request_options.
  Executes any actions under the .response property (or default_response_actions) on completion of the request. 

Syntax:
  - request:
      url: ...
      method: POST
    response:
      - action1
      - action2
*/

var _ = require("lodash");
var Promise = require("bluebird");
var verror = require("verror");

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
			action.response = normalize_action(action.response, "response");
		}
		return action;
	}
};

module.exports.process = function (context) {
	if (!context.httpClient) {
		module.exports.logger.trace("Initializing new httpClient for this session");
		context.httpClient = Promise.promisify(require("request"));
		context.httpClient = context.httpClient.defaults({ jar: context.httpClient.jar(context.cookieStore()) });
	}

	// Now apply default values from "request_defaults" session object
	var request = {};
	_.merge(request, default_useragent, _.get(context.session, "hyperpotamus.default_request_options"), this.request);
	request = context.interpolate(request);

	// If binary: true then set the encoding
	if (request.binary) {
		request.encoding = null;
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

	module.exports.logger.info(`About to send request ${request.method || "GET"} ${request.url}`);
	var request_started = new Date();
	var self = this;
	request.simple = true;
	request.resolveWithFullResponse = true;
	return context.httpClient(request).then(response => {
		var request_timing = new Date() - request_started;
		var body;
		if (_.isString(response.body)) {
			body = response.body;
		}
		else if (_.isBuffer(response.body)) {
			body = response.body.toString();
		}
		else if (_.isObject(response.body)) {
			body = JSON.stringify(response.body, null, 2);
		}
		else {
			body = "";
		}

		if (response && response.statusCode) {
			module.exports.logger.info(`Received response in ${request_timing} msec. Status: ${response.statusCode} Content-Length: ${body.length}`);
		}
		module.exports.logger.debug("Response is " + JSON.stringify(response));
		if (context.before_validate) {
			module.exports.logger.debug("About to invoke options.before_validate");
			context.before_validate(self, context);
		}
		var response_actions = self.response;
		if (_.isNil(response_actions)) {
			response_actions = context.getSessionValue("hyperpotamus.default_response_actions", null, null) || [ { status: 200 } ];
		}

		// Save previous values for response so they can be reset after processing.
		var existing_response = context.response;
		var existing_buffer = context.buffer;
		var existing_body = context.body;
		var existing_request = _.get(context.session, "hyperpotamus.request");

		context.response = response;
		context.buffer = response.body;
		context.body = body;

		context.setSessionValue("hyperpotamus.request", request);

		return context.processAction(response_actions)
			.catch(err => {
				if(err instanceof context.ProcessingDirective || verror.hasCauseWithName(err, "ResponseActionError")) {
					throw err;
				}
				throw new verror.VError({
					name: "ResponseActionError",
					cause: err,
					info: {
						request: _.pick(context.response.request, ["method", "href", "headers", "body"]),
						response: _.pick(context.response, ["body", "response"])
					},
				}, "Error processing post-response actions for request");
			})
			.finally(() => {
				// Reset the previous response values in the context
				context.response = existing_response;
				context.buffer = existing_buffer;
				context.body = existing_body;
				if(_.isNil(existing_request)) {
					_.unset(context.session, "hyperpotamus.request");
				}
				else {
					context.setSessionValue("hyperpotamus.request", existing_request);
				}
			});
	});
};
