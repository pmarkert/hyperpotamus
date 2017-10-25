var _ = require("lodash");
var querystring = require("querystring");
var yaml = require("../lib/yaml");

module.exports = function (args) {
	// Now load data for the default session state from querystring and data files
	var defaultSession = {};
	if (args.qs) {
		// Load in data for the initial session from the qs parameter
		defaultSession = _.castArray(args.qs).reduce((cumulative, data) => _.defaultsDeep(cumulative, querystring.parse(data)), {});
	}
	if (args.session) {
		_.defaults(defaultSession, args.session);
	}
	if (args.data) {
		// Load in data for the initial session from any data files (earlier files take precedence)
		defaultSession = _.castArray(args.data).reduce((cumulative, file) => _.defaultsDeep(cumulative, yaml.loadFile(file, args.safe)), defaultSession);
	}
	return defaultSession;
};
