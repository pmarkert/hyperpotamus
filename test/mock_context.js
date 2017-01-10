var _ = require("lodash");
exports.expected_failure = { message: "Expected failure" };

exports.instance = function instance(session) {
	return {
		session: _.defaultTo(session, {}),
		processed_actions: [],
		processAction: function (action, context) {
			var self = this;
			if (_.isArray(action)) {
				// Loop through each response validation step and verify
				return Promise.all(action.map(single_action => self.processAction(single_action, context)));
			}
			this.processed_actions.push(action);
			if (action === true) {
				return Promise.resolve(true);
			}
			if (action === false) {
				return Promise.reject(exports.expected_failure);
			}
			throw new Error("Action type has not been implemented for mock-context");
		}
	}
}

