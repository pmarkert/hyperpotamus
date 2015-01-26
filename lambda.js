// This is the entrypoint if you are using hyperpotamus from inside of AWS Lambda. 
// Create a .zip file of this whole repository, upload it to AWS as a lambda function
// package, and then specify "lambda.js" for the filename and "handler" for the method
// name. To invoke the function, POST { "script" : JSON-encoded script }
var hyperpotamus = require("hyperpotamus").processor(false);

function options(options, context) {
	return {
		emit: console.log,
		done: function(err) { context.done(null, err); }
	};
}

exports.handler = function(event, context) {
	hyperpotamus.process(event.script, event.session, options(event.options, context));
}
