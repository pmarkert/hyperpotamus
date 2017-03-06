var _ = require("lodash");
var Promise = require("bluebird");
var Context = require("../lib/context");

exports.expected_failure = { message: "Expected failure" };

exports.instance = function instance(session) {
	var startingSession = _.defaultTo(session, {});
	var mockProcessor = { options: { sessionDefaults: {} } };
	
	var context = new Context(startingSession, mockProcessor, processAction, handleDirective);
	context.processed_actions = [];
	return context;

	function processAction(action, context) {
		if (_.isArray(action)) {
			// Loop through each response validation step and verify
			return Promise.mapSeries(action, single_action => processAction(single_action, context));
		}
		context.processed_actions.push(action);
		if (action === true) {
			return Promise.resolve(true);
		}
		if (action === false) {
			return Promise.reject(exports.expected_failure);
		}
		throw new Error("Action type has not been implemented for mock-context");
	}
	
	function handleDirective() {
		throw new Error("Not Yet Implemented");
	}
};
