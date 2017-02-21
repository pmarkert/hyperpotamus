var _ = require("lodash");
var verror = require("verror");
var Promise = require("bluebird");
var interpolate = require("../lib/interpolate");
exports.expected_failure = { message: "Expected failure" };

exports.instance = function instance(session) {
	return {
		session: _.defaultTo(session, {}),
		processed_actions: [],
		processAction: function (action, context) {
			var self = this;
			if (_.isArray(action)) {
				// Loop through each response validation step and verify
				return Promise.mapSeries(action, single_action => self.processAction(single_action, context));
			}
			this.processed_actions.push(action);
			if (action === true) {
				return Promise.resolve(true);
			}
			if (action === false) {
				return Promise.reject(exports.expected_failure);
			}
			throw new Error("Action type has not been implemented for mock-context");
		},
		interpolate: function (template) {
			return interpolate(template, session);
		},
		getSessionValue: function getSessionValue(key, path) {
			var result = _.get(this.session, key);
			if (_.isUndefined(result)) {
				throw new verror.VError({
					name: "MissingKeyError",
					constructorOpt: this.getSessionValue,
					info: {
						key,
						path
					}
				}, "No matching value found in the session. Key: %s", key);
			}
			return result;
		},
		setSessionValue: function (path, value) {
			_.set(this.session, path, value);
		}
	};
};

