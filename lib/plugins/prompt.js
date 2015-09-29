var _ = require("underscore");
var regex_helper = require("./helpers/regex");
var prompt = require("prompt");

module.exports.name = "prompt";

module.exports.safe = false;

module.exports.normalize = function(action) {
	if(module.exports.handles(action)) {
		if(!_.isObject(action.prompt.properties)) {
			var prompts = [];
			for(var key in action.prompt) {
				var item = action.prompt[key];
				item.name = key;
				if(_.isString(item.pattern)) {
					item.pattern = regex_helper.extract_regex(item.pattern);
				}
				prompts.push(item);
			}	
			action.prompt = prompts;
			return action;
		}
	}
}

module.exports.handles = function(action) {
	return _.isObject(action.prompt);
}

module.exports.process = function(context, callback) {
	for(var i=this.prompt.length-1;i>=0;i--) {
		if(_.isObject(this.prompt[i].pattern) && !_.isRegExp(this.prompt[i].pattern)) {
			this.prompt[i].pattern = regex_helper.make_regex(this.prompt[i].pattern, context.session);
		}
	}
	this.prompt = _.filter(this.prompt, function(item) { return item.required || _.isUndefined(context.session[item.name]); });
	prompt.start();
	prompt.addProperties(context.session, this.prompt, function(result) { callback(null, result); });
}
