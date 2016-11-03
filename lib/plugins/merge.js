module.exports.safe = true;

/*
Purpose:
  Merge values into the context.

Example:
  - defaults:
     key1: value1
     key2: value2
*/

var _ = require("lodash");

module.exports.normalize = function(action) {
	if(_.has(action, "set")) {
		action.merge = { source: action.set, override: true };
		delete(action.set);
		return action;
	}
	else if(_.has(action, "defaults")) {
		action.merge = { source: action.defaults, override: false };
		delete(action.defaults);
		return action;
	}
	else if(_.has(action, "merge")) {
		return action;
	}
}

module.exports.process = function (context) {
	var target;
	if(_.isUndefined(this.merge.target)) {
		target = context.session;
	}
	else {
		if(_.isString(this.merge.target)) {
			target = context.interpolate("<%! " + this.merge.target + " %>");
		}
		else {
			target = this.merge.target;
		}
	}
	if(this.merge.override) {
		// Merges into the target
		_.merge(target, this.merge.source);
	}
	else {
		// Merges into the action source, so then we have to copy back to modify the target
		_.assign(target, _.merge(this.merge.source, target));
	}
}
