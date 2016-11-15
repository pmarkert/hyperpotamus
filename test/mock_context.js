var _ = require("lodash");
var async = require("async");

module.exports.expected_failure = { message: "Expected failure" };

module.exports.instance = function instance(session) {
	return {
		session: _.defaultTo(session, {}),
		processed_actions: [],
		process_action: function (action, context, done) {
			var self = this;
			if (_.isArray(action)) {
				// Loop through each response validation step and verify
				return async.eachSeries(action, function (single_action, callback) {
					self.process_action(single_action, context, callback);
				}, done);
			}
			this.processed_actions.push(action);
			if (action === true) {
				if(done) { done() };
				return;
			}
			if (action === false) {
				if(done) { done(module.exports.expected_failure) };
				return module.exports.expected_failure;
			}
		}
	}
}

