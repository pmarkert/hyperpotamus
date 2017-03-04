var _ = require("lodash");
var verror = require("verror");
var tough = require("tough-cookie");
var Promise = require("bluebird");

module.exports.safe = true;

module.exports.process = function process(context) {
	return Promise.mapSeries(_.castArray(this.cookies), (c, index) => {
		var cookie = new tough.Cookie(_.defaults(c, { path: "/", domain: "*" }));
		var universalCookie = cookie.domain=="*";
		if(universalCookie) {
			// Need to temporarily remove the domain for universal cookies since "*" is not normally valid.
			cookie.domain = null;
		}
		if (!cookie.validate()) {
			throw new verror.VError({
				name: "InvalidCookie",
				info: {
					path: `${this.path}.cookies.${index}`,
					cookie
				}
			}, "Invalid cookie parameter value");
		}
		if(universalCookie) {
			// Replace the domain before storing the cookie
			cookie.domain = "*";
		}
		return context.cookieStore().putCookiePromise(cookie);
	});
};
