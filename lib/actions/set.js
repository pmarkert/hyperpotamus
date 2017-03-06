module.exports.safe = true;

/*
Purpose:
  Set values in the context.

- set:
	key: value

- set:
	target: session_key
	source:
	  key: value

- set:
	target: <%! object_reference %>
	source:
	  key: value
 */

var _ = require("lodash");
var verror = require("verror");

module.exports.normalize = function (action, action_normalizer, path) {
	function doNormalize(mode) {
		var sub_object = action[mode];
		if (!_.isPlainObject(sub_object)) {
			throw new verror.VError({
				name: "ActionStructureError.set",
				info: {
					path: path + "." + mode,
					value: sub_object
				}
			}, "The value of .%s must be an object", mode);
		}
		delete action[mode];
		if (!_.has(sub_object, "source")) {
			// Shortcut, rewrite to explicit structure
			action.set = {
				source: sub_object,
				mode
			};
		}
		else {
			action.set = sub_object;
			sub_object.mode = _.isNil(sub_object.overwrite) ? mode : sub_object.overwrite;
		}
		return action;
	}

	if (_.has(action, "set")) {
		return doNormalize("set");
	}
	else if (_.has(action, "defaults")) {
		return doNormalize("defaults");
	}
	else if (_.has(action, "merge")) {
		return doNormalize("merge");
	}
};

module.exports.process = function (context) {
	var target;
	if (_.isNil(this.set.target)) {
		target = context.session;
	}
	else {
		if (_.isString(this.set.target)) {
			target = _.get(context.session, this.set.target);
			if(this.set.mode == "set" || !_.isPlainObject(target)) {
				if(!(this.set.mode == "defaults" && !_.isNil(target))) {
					_.set(context.session, this.set.target, this.set.source);
				}
				return;
			}
		}
		else {
			throw new verror.VError({
				name: "InvalidSetTargetError",
				info: {
					path: this.path + ".set.target"
				}
			}, "If .target is specified for a .set command, it must be a string session key");
		}
	}
	switch(this.set.mode) {
		case "set":
			_.assign(target, this.set.source);
			break;
		case "defaults":
			_.defaults(target, this.set.source);
			break;
		case "merge":
			_.merge(target, this.set.source);
	}
};
