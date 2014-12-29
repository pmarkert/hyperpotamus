var hyperpotamus = require("./lib");
var querystring = require("querystring");
var data = {};
if(process.argv.length>3) {
	data = querystring.parse(process.argv[3]);
}
console.log("Initial session data is " + JSON.stringify(data));
hyperpotamus.process_file(process.argv[2], data, function(err, session) {
	if(err) {
		console.error("Error - " + err);
		return process.exit(1);
	}
	console.log("Final session data is " + JSON.stringify(session));
}, function(step, response, body) {
	console.log("Completed request for " + step.request.url + " - response was " + body);
});
