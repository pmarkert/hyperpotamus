var _ = require("lodash");

module.exports.safe = true;

/* 
Purpose:
  Replaces occurrences of [match] inside of a [value] with [replacement], storing 
  the results in [key]

Examples:
  replace: 
    key: # The key under which to store the results of the replacement
      value: string to be searched
      match: value_to_match # or !!js/regexp /regex_to_match/gi 
      replacement: value_to_replace

  replace:
    key: # The key under which to store the results of the replacement
      array: key of the array to process (each value will be processed)
      match: value_to_match # or !!js/regexp /regex_to_match/gi 
      replacement: value_to_replace
*/

module.exports = { 
	handles: handles,
	process: process
}

function handles(action) {
	return _.isObject(action.replace);
}

function process(context) {
	for(var key in this.replace) {
		var tuple = this.replace[key];
		if(_.isString(tuple.array)) { // Process as an array
			var source = context.session[tuple.array]
			var result = [];
			for(var i=0;i<source.length;i++) {
				result.push(source[i].replace(tuple.match, tuple.replacement));
			}
			context.session[key] = result;
		}
		else {
			context.session[key] = tuple.value.replace(tuple.match, tuple.replacement);
		}
	}
}
