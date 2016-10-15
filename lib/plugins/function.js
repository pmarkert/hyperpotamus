module.exports.name = "function";
module.exports.safe = false;

var logger = require("../logging").logger("hyperpotamus.plugins." + module.exports.name);

/* 
Purpose:
  Executes a custom javascript function.
  The action can either directly be a function, or must have a .function property

  The custom function to be executed may take either one parameter (for synchronous invocation) or two parameters (for asynchronous invocation). 

  The first parameter is the hyperpotamus context. 
  The hyperpotamus context exposes information about the current request, response, session, and other utility methods.

  If the function does not take a second parameter, then it will be invoked synchronously. If the function returns void/null, it will be considered
  successful, otherwise, any returned object will be considered an error.

  If the function takes a second parameter, it is the callback function to be invoked upon completion. Any parameter passed to the callback will be
  considered an error and handled by hyperpotamus. 
  
  Error objects returned from custom functions should include a .message property and may also specify a .goto property which is the name of the next 
  request to execute, or one of the special jump_keys (SELF, END, NEXT). As a special case if a string is returned, it will be treated as the .message.

  The context (this) for the custom function will be bound to the action script element itself, so any additional properties on the action can be 
  accessed from inside the function.

  The .imports property is optional, but if present must either be an array or a key/value object. The .imports object/array specifies javascript 
  libraries to be imported and made available for the custom function's use. Each value will be imported by hyperpotamus (using require()) and 
  the value will be replaced by the imported module.
  
  NOTE: When defining javascript properties in YAML, tab-indentation is still not allowed.

Examples:
  function: !!js/function >
   function(context) {
     if(context.response.status > 200) 
       return "Unexpected status code";
   }

=====

  value_to_hash: <% session_value %>
  imports: 
    crypto: crypto
  function: !!js/function >
    function(context, callback) {
      var md5 = this.imports.crypto.createHash("MD5");
      md5.update(this.value_to_hash);
      context.session["hash"] = md5.digest("hex");
      callback();
    }
}
*/

var _ = require("underscore");

module.exports = { 
	normalize: normalize,
	handles: handles,
	process: process
}

function normalize(action) {
	if(_.isFunction(action)) {
		action = { "function": action };
	}
	if(handles(action)) {
		if(_.isObject(action.imports)) { // Works for arrays too
			// TODO - Check for relative path and map to be relative to the script
			for(var key in action.imports) {
				logger.info("Attempting to import - " + action.imports[key] + " to support 'function' action.");
				action.imports[key] = require(action.imports[key]);
			}
		}
		if(action["function"].length>2) {
			throw new Error("Custom function has unexepcted number of arguments.");
		}
	}
}

function handles(action) {
	return _.isObject(action) && _.isFunction(action["function"]);
}

function process(context, callback) {
	logger.debug("About to invoke custom function");
	var func = this["function"];
	if(func.length<2) { // Synchronous function
		func.call(this, context);
		return callback();
	}
	else {
		func.call(this, context, function(err) {
			if(err) return callback(err, context.response, "Custom function");
			return callback();
		});
	}
}
