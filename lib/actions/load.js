var _ = require("lodash");
var yaml = require("../yaml");

module.exports.safe = false;

/*
- load:
    session_key: filename
*/

module.exports.process = function (context) {
	_.each(this.load, (value, key) => {
		context.setSessionValue(key, yaml.load(value, context.options.safe));
	});
};
