var _ = require("lodash");

module.exports = function normalizer(action) {
	if(_.isArray(action)) {
		return action.map(normalizer);
	}
	if (action.normalized == false) {
		action.normalized = true;
		return action;
	}
};
