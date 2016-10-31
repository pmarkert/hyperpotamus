module.exports.safe = true;

var _ = require("lodash");
var regex_helper = require("./helpers/regex");

module.exports.normalize = function(action) {
        if(_.isString(action)) {
                if(!regex_helper.extract_regex(action)) {
			return { text : action };
		}
        }
        return;
}

module.exports.process = function(context) {
        if(context.body.indexOf(this.text)==-1) {
                return { message : "Body did not match text", expected: this.text, actual: context.body };
        }
}
