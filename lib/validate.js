var _ = require("underscore");
var async = require("async");
var fs = require("fs");
var path = require("path");

module.exports = function(options) {
	var files = fs.readdirSync(path.join(__dirname, "validation"));
	var jsfiles = _.filter(files, function(file) { return path.extname(file)===".js"; });
	var handlers = _.map(jsfiles, function(file) { return require(path.join(__dirname, "validation", file)); } );

	function validate(validation, session, response, body, callback) {
		var context = { 
			validation: validation,
			session: session,
			response: response,
			body: body,
			callback: callback
		};

		// TODO - add not: to negate a validation
		// TODO - add validation.set to explictly set values

		for(var i=0; i<handlers.length; i++) {
			if(handlers[i].handles(validation)) {
				handlers[i].process(context);
				return;
			}
		}
		throw new Error("No handler found for validation - " + JSON.stringify(validation));
	}

	return function(step, session, response, body, done) {
		// Loop through each validation step and verify
		async.eachSeries(step.response, function(validation, callback) {
			validate(validation, session, response, body, function(err, compare, value) {
				if(err) {
					return callback({ message: err + "." + compare + " vs. " + value, jump_to_key: validation.on_failure });
				}
				else {
					if(validation.on_success) {
						return callback( { message : null, jump_to_key: validation.on_success });
					}
					else {
						return callback();
					}
				}
			});
		}, function(err) {
			if(err)
				return done(err.message, err.jump_to_key);
			else
				return done();
		});
	}
}
