var _ = require("underscore");
var querystring = require("querystring");
var interpolate = require("./interpolate");
var httpClient = require("request");
var socks = require("socks5-http-client/lib/Agent");

module.exports = function(request, session, options, callback) {
	request = interpolate(request, session);
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
	if(options.before_request) options.before_request(request);
	var httpRequest = httpClient(request, callback);
	if(request_data) 
		httpRequest.write(request_data);
	httpRequest.end();
}
