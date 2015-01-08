var _ = require("underscore");
var async = require("async");
var fs = require("fs");
var path = require("path");

// TODO - add not: to negate a validation
// TODO - add validation.set to explictly set values

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
		};

		// First filter to get a list of interested handlers
		var interested_handlers = _.filter(handlers, function(handler) { 
			var result = handler.handles(validation); 
//console.log("Handler is " + handler.name + ", validation is " + JSON.stringify(validation) + ", result is " + result);
			return result;
		});
		async.eachSeries(interested_handlers, function(handler, validation_callback) {
			handler.process(context, function(err, compare, value) {
				// If the handler returns an error (or not), evaluate against on_success and on_failure
				// to figure out if we need to jump, fail, or proceed
				if(err) { // Jump or fail
					return validation_callback({ message: err + "." + compare + " vs. " + value, jump_to_key: validation.on_failure });
				}
				else { 
					if(validation.on_success) { // Jump
						return validation_callback( { message : null, jump_to_key: validation.on_success });
					}
					else { // Continue
						return validation_callback();
					}
				}
			});
		}, callback);
	}

	return function(step, session, response, body, callback) {
		// Loop through each response validation step and verify
		async.eachSeries(step.response, function(validation, callback) {
			validate(validation, session, response, body, callback);
		}, function(err) {
			if(err) return callback(err.message, err.jump_to_key);
			return callback();
		});
	}
}
