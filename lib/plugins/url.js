var _ = require("underscore");
var url = require("url");

// The resolve action resolves a target URL relative to a base URL in a manner similar to that of a Web browser resolving an anchor tag HREF.

/* Example 
resolve:
  answer: // The key to store the results
    base: 'http://example.com/one'
    relative: '/two'
*/


module.exports.name = "resolve";

module.exports.safe = true;

module.exports.handles = function(action) {
	return _.isObject(action.resolve);
}

module.exports.process = function(context) {
	for(var key in this.resolve) {
		var toResolve = this.resolve[key];
		context.session[key] = url.resolve(toResolve.base, toResolve.relative);
	}
}
