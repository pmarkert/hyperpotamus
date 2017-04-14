module.exports.safe = true;

/*
Purpose:
  Unset keys/paths in the session context.

- unset: key

- unset: [ key1, key2, "path" ]
*/

var _ = require("lodash");
var verror = require("verror");

module.exports.normalize = function (action, action_normalizer, path) {
	if (_.has(action, "unset")) {
		action.unset = _.castArray(action.unset);
		return action;
	}
};

module.exports.process = function (context) {
	this.unset.forEach(_.partial(_.unset, context.session));
};
