var express = require("express");
var app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Echo back diagnostic information about the incoming request
function process(req, res) {
	var result = {};
	result.url = req.url;
	result.method = req.method;
	result.headers = req.headers;
	result.query = req.query;
	result.body = req.body;
	return res.json(result);
}

app.get("/get", process);
app.post("/post", process);
app.put("/put", process);

app.get("/status/:status", function(req, res) {
	return res.status(parseInt(req.params.status)).end();
});


app.get("/redirect-to", function(req, res) {
	return res.redirect(req.query.url);
});

module.exports = app;
