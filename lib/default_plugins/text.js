var _ = require("underscore");
var regex_helper = require("./helpers/regex");

module.exports.name = "text";

module.exports.safe = true;

module.exports.normalize = function(action) {
        if(_.isString(action)) {
                if(!regex_helper.extract_regex(action)) {
			return { text : action };
		}
        }
        return;
}

module.exports.handles = function(action) {
	return _.isString(action.text);
}

module.exports.process = function(action, context, callback) {
        var err;
        var compare = action.text;
        if(context.body.indexOf(compare)==-1) {
                err = "Body did not match text";
        }
        return callback(err, compare, context.body);
}
