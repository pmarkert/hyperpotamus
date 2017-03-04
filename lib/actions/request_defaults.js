var _ = require("lodash");
var verror = require("verror");
var tough = require("tough-cookie");
var Promise = require("bluebird");

module.exports.safe = true;

/* 
Purpose:
  Sets default options to be processed on a request. These values are deeply merged into future request objects. 

Syntax:
  - request_defaults:
      # Default request options such as headers, auth, proxy, method, etc.
        
  - request_defaults:
      domain: hyperpotamus.io
      path: /special
      request:
         # Default request options
*/

module.exports.normalize = function normalize(action, normalize_action, path) {
	if (_.has(action, "request_defaults")) {
		action.request_defaults = _.map(_.castArray(action.request_defaults), rd => {
			if (!_.isPlainObject(rd)) {
				throw new verror.VError({
					name: "ActionStructureError.request_defaults",
					info: {
						path
					}
				}, "request_defaults elements should be an object");
			}
			// If the element does not have a "request" property, nest the whole object as the .request property
			if (!_.isNil(rd.request)) {
				// Rename .request property to .value if it exists
				if (!_.isNil(rd.value)) {
					throw new verror.VError({
						name: "ActionStructureError.request_defaults",
						info: {
							path
						}
					}, "request_defaults elements may specify either .value or .request (alias), but not both");
				}
				rd.value = rd.request;
				delete rd.request;
			}

			if (_.isNil(rd.value)) {
				rd = { value: rd };
			}
			_.defaults(rd, { path: "/", domain: "*" });
			rd.key = "request_defaults";
			return rd;
		});
		return action;
	}
};

module.exports.process = function process(context) {
	return Promise.mapSeries(this.request_defaults, rd => {
		return context.requestDefaultsStore().putCookiePromise(new tough.Cookie(rd));
	});
};
