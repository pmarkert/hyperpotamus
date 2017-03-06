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
var tough = require("tough-cookie");
var yaml = require("../yaml");
var request_module = Promise.promisify(require("request"));

var hyperpotamus_defaults = {
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

function mergeRequestWithDefaults(request, request_defaults) {
	var result = {};
	var args = [result, hyperpotamus_defaults];
	var request_defaults_jar = new tough.CookieJar(request_defaults);
	var getCookies = Promise.promisify(request_defaults_jar.getCookies, { context: request_defaults_jar });
	return getCookies(request.url)
		.then(request_defaults => {
			args = args.concat(_.map(request_defaults, "value"));
			args.push(request);
			_.merge.apply(null, args);
			return result;
		});
}

function aliasBinaryEncoding(request) {
	// If binary: true then set the encoding
	if (request.binary) {
		request.encoding = null;
	}
}

function setupSocksProxy(request) {
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
}

function setupPromiseOptions(request) {
	// These are options required to make request-promise behave more like request
	// and to avoid some of the shortcuts added to simplify the promises.
	request.simple = true; // Don't treat non-200's as errors
	request.resolveWithFullResponse = true; // Resolve with the full response object, not just the body
}

module.exports.process = function (context) {
	if (!context.httpClient) {
		module.exports.logger.trace("Initializing new httpClient for this session");
		context.httpClient = request_module.defaults({ jar: request_module.jar(context.cookieStore()) });
	}
	var existing_request = context.getSessionValue("hyperpotamus.request", null, undefined);
	var existing_response = context.getSessionValue("hyperpotamus.response", null, undefined);
	return mergeRequestWithDefaults(this.request, context.requestDefaultsStore())
		.then(context.interpolate)
		.tap(aliasBinaryEncoding)
		.tap(setupSocksProxy)
		.tap(setupPromiseOptions)
		.tap(request => {
			module.exports.logger.info(`About to send request ${request.method || "GET"} ${request.url}`);
			request.timing = { started: new Date() };
			context.setSessionValue("hyperpotamus.request", request);
		})
		.then(context.httpClient)
		.tap(response => {
			var request = context.getSessionValue("hyperpotamus.request");
			request.timing.completed = new Date();
			request.timing.time_taken = request.timing.completed - request.timing.started;
			var response_length = response.headers["content-length"] || response.headers["transfer-encoding"];
			module.exports.logger.info(`Received response in ${request.timing.time_taken} milliseconds. Status: ${response.statusCode}, Response length: ${response_length}`);
			context.setSessionValue("hyperpotamus.response", response);
		})
		.then(response => {
			module.exports.logger.debug("Response is " + yaml.dump(_.pick(response, ["statusCode", "headers", "body"])));
			var response_actions = this.response;
			if (_.isNil(response_actions)) {
				response_actions = context.getSessionValue("hyperpotamus.default_response_actions", null, null) || [{ status: 200 }];
			}
			return context.processAction(response_actions);
		})
		.catch(err => {
			if (err instanceof context.ProcessingDirective || verror.hasCauseWithName(err, "ResponseActionError")) {
				throw err;
			}
			throw new verror.VError({
				name: "ResponseActionError",
				cause: err,
				info: {
					request: _.pick(context.getSessionValue("hyperpotamus.request"), ["method", "href", "headers", "body"]),
					response: _.pick(context.getSessionValue("hyperpotamus.response"), ["status", "headers", "body"])
				},
			}, "Error processing post-response actions for request");
		})
		.finally(() => {
			// Reset the previous response values in the context
			if (_.isNil(existing_request)) {
				_.unset(context.session, "hyperpotamus.request");
			}
			else {
				context.setSessionValue("hyperpotamus.request", existing_request);
			}
			if (_.isNil(existing_response)) {
				_.unset(context.session, "hyperpotamus.response");
			}
			else {
				context.setSessionValue("hyperpotamus.response", existing_response);
			}
		});
};
