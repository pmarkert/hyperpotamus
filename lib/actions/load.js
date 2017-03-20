var _ = require("lodash");
var yaml = require("../yaml");
var path = require("path");
var fs = require("fs");

module.exports.safe = false;

/*
- load:
    session_key: filename
*/

module.exports.process = function (context) {
	_.each(this.load, (value, key) => {
		if(_.isString(value)) {
			value = { filename: value };
		}
		if(_.has(value, "file") && !_.has(value, "filename")) {
			value.filename = value.file;
			delete(value.file);
		}
		if(_.has(value, "json") && !_.has(value, "yaml")) {
			value.yaml = value.json;
			delete(value.json);
		}
		if(_.has(value, "yml") && !_.has(value, "yaml")) {
			value.yaml = value.yml;
			delete(value.yml);
		}
		if(_.isNil(value.yaml)) {
			value.yaml = _.includes([ ".yaml", ".json", ".yml" ], path.extname(value.filename));
		}
		if(value.yaml) {
			context.setSessionValue(key, yaml.loadFile(value.filename, _.isNil(value.safe) ? context.options.safe : value.safe));
		}
		else {
			if(!_.has(value, "encoding")) {
				value.encoding = value.binary ? null : "UTF-8";
			}
			context.setSessionValue(key, fs.readFileSync(value.filename, value));
		}
	});
};
