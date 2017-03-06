var MemoryCookieStore = require("tough-cookie").MemoryCookieStore;
var pathMatch = require("tough-cookie/lib/pathMatch").pathMatch;
var Promise = require("bluebird");
var util = require("util");
var _ = require("lodash");

/*
  This tough-cookie store inherits from the default MemoryCookieStore, but adds the feature that any cookies
  added with a "*" domain will be valid for all domains. While a bad idea for any real user-agent that keeps
  persistent cookies, for a scripting engine, it reduces the burden on script developers so that cookie
  values can be set without respect to the domain. Simplifying cross-domain scripts (like DEV vs. QA vs. PROD
  environments).
 */

function HyperpotamusCookieStore() {
	MemoryCookieStore.call(this);
}
util.inherits(HyperpotamusCookieStore, MemoryCookieStore);

module.exports = Promise.promisifyAll(HyperpotamusCookieStore, { suffix: "Promise" });

HyperpotamusCookieStore.prototype.findCookies = function (domain, path, cb) {
	var idx = this.idx;
	MemoryCookieStore.prototype.findCookies.call(this, domain, path, function (err, results) {
		if (err) {
			return cb(err);
		}

		var domainIndex = idx["*"];
		if (domainIndex) {
			if (!path) {
				// null means "all paths"
				for (var curPath in domainIndex) {
					var pathIndex = domainIndex[curPath];
					for (var key in pathIndex) {
						results.push(_.defaults({ domain }, _.clone(pathIndex[key])));
					}
				}
			}
			else {
				Object.keys(domainIndex).forEach(function (cookiePath) {
					if (pathMatch(path, cookiePath)) {
						var pathIndex = domainIndex[cookiePath];
						for (var key in pathIndex) {
							results.push(_.defaults({ domain }, _.clone(pathIndex[key])));
						}
					}
				});
			}
		}
		cb(null, results);
	});
};
