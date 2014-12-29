var _ = require("underscore");
var http = require("http");
var https = require("https");
var zlib = require("zlib");
var url_parser = require("url");
var querystring = require("querystring");

var interpolate = require("./interpolate");

module.exports = function(request, session, callback) {
	var req = url_parser.parse(interpolate(request.url, session));
	req.headers = request.headers ? request.headers : {};
	var proto = req.protocol==="https:" ? https : http;
	if(request.method)
		req.method = request.method;
	if(request.data) {
		var request_data;
		if(_.isString(request.data)) {
			request_data = request.data;
		}
		if(request.mode == "form") {
			if(!_.isString(request.data)) {
				request_data = querystring.stringify(request.data);
			}
			req.headers["Content-Type"] = "application/x-www-form-urlencoded";
		}
		else if(request.mode == "json") {
			if(!_.isString(request.data)) {
				request_data = JSON.stringify(request.data);
			}
			req.headers["Content-Type"] = "application/json";
		}
		request_data = interpolate(request_data, session);
		req.headers["Content-Length"] = request_data.length;
	}
	var httpRequest = proto.request(req, function(res) {
		var buffers = [];

		// set up pipe for response data, gzip or plain based on respone header
		var stream = res.headers['content-encoding'] && res.headers['content-encoding'].match(/gzip/) ? res.pipe(zlib.createGunzip()) : res;
		stream.on('data', function(chunk) {
			buffers.push(chunk);
		}).on('end', function() {
			callback(null, res, Buffer.concat(buffers).toString());
		});
	});
	httpRequest.on('error', function(err) {
		callback(err);
	});
	if(request_data) 
		httpRequest.write(request_data);
	httpRequest.end();
}
