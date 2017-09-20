module.exports.safe = false;

/*
Purpose:
  Saves the HTTP body content (or the value of the .content property) to a file.
 */
var _ = require("lodash");
var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");
var Promise = require("bluebird");
var verror = require("verror");

module.exports.normalize = function normalize(action) {
	if(_.has(action, "save")) {
		if(_.isString(action.save)) {
			action.save = { filename: action.save };
		}
		if(_.has(action.save, "content")) {
			if(_.has(action.save, "target")) {
				throw new verror.VError({
					name: "InvalidActionConfiguration.save",
					info: {
						path: action.path
					}
				}, ".content is an alias for .target, so both cannot be specified for save actions");
			}
			action.save.target = action.save.content;
			delete(action.save.content);
		}
		return action;
	}
}

module.exports.process = function process(context) {
	var content;
	if(_.has(this.save, "target")) {
		content = this.save.target;
	}
	else {
		var response = context.getSessionValue("hyperpotamus.response", null, undefined);
		if (_.isNil(response)) {
			throw new verror.VError({
				name: "InvalidActionPlacement.save",
				info: {
					path: this.path + ".save"
				}
			}, "If no .target is specified, then the .save action must be used within the response of a .request action.");
		}
		content = response.body;
	}
	if (_.isNil(content)) {
		throw new verror.VError({
			name: "NullSaveContent",
			info: {
				path: this.path + ".save"
			}
		}, "The content to be saved was null.");
	}
	if (!_.isString(this.save.filename)) {
		throw new verror.VError({
			name: "InvalidActionValue.save",
			info: {
				path: this.path + ".save.filename"
			}
		}, "The .filename property is expected to be a path (string)");
	}
	if(this.save.encoding==="binary") {
		this.save.encoding === null;
	}
	return Promise.promisify(mkdirp)(path.dirname(this.save.filename))
		.then(() => {
			return Promise.promisify(fs.writeFile)(this.save.filename, content, this.save);
		});
};
