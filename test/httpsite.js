var express = require("express");
var app = express();
var bodyParser = require('body-parser')
app.use(require("cookie-parser")());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Echo back diagnostic information about the incoming request
function process_request(req, res) {
	var result = {};
	result.url = req.url;
	result.method = req.method;
	result.headers = req.headers;
	result.query = req.query;
	result.body = req.body;
	return res.json(result);
}

app.get("/get", process_request);
app.post("/post", process_request);
app.put("/put", process_request);

app.get("/status/:status", function(req, res) {
	return res.status(parseInt(req.params.status)).end();
});


app.get("/redirect-to", function(req, res) {
	return res.redirect(req.query.url);
});

app.post("/json", function(req, res) {
	return res.json(req.body);
});

app.get("/cookie", function(req, res) {
	for(var key in req.query) {
		res.cookie(key, req.query[key]);
	}
	return res.json( { cookies: req.cookies } );
});

app.use("/static", express.static(__dirname + "/static"));

module.exports = app;
var port = 3000;
if(process.env.PORT)
	port = parseInt(process.env.PORT);

if(require.main === module) {
	app.listen(port, function(err) {
		if(err) {
			return console.log("Error starting web-server : " + err);
		}	
		console.log("Listening on port - " + port);
	});
}
