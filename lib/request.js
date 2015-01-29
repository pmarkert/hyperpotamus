var _ = require("underscore");
var querystring = require("querystring");
var interpolate = require("./interpolate");
var httpClient = require("request");
var socks = require("socks5-http-client/lib/Agent");

module.exports = function(request, context, callback) {
	if(!context.defaults.jar) {
		context.defaults.jar = httpClient.jar();
	}
	request = interpolate(request, context.session);
	if(!request.url) 
		return callback(null, { statusCode: 0, headers: {} }, new Buffer(""));
	if(request.socks) {
		request.agent = new socks(request.socks);
	}
	if(request.data) { 
		var request_data;
		if(_.isString(request.data)) {
			request_data = request.data;
		}
		if(request.mode == "form") {
			if(!_.isString(request.data)) {
				request_data = querystring.stringify(request.data);
			}
			request.headers["Content-Type"] = "application/x-www-form-urlencoded";
		}
		else if(request.mode == "json") {
			if(!_.isString(request.data)) {
				request_data = JSON.stringify(request.data);
			}
			request.headers["Content-Type"] = "application/json";
		}
	}
	if(context.options.before_request) context.options.before_request(request);
	var httpRequest = httpClient.defaults(context.defaults)(request, callback);
	if(request_data) 
		httpRequest.write(request_data);
	httpRequest.end();
}
