module.exports = function normalizer(action) {
	if (action.normalized == false) {
		action.normalized = true;
		return action;
	}
};
