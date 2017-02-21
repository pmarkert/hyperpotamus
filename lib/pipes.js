var _ = require("lodash");
var moment = require("moment-timezone");
var crypto = require("crypto");
var named = require("named-regexp").named;
var url = require("url");

exports.optional = function (val, replacement) {
	return _.isUndefined(val) ? trim(replacement) : trim(val);
};

exports.csv_safe = function (val) {
	val = trim((val || "").toString()).split("\"").join("\\\"");
	if (val.indexOf(",") >= 0) {
		val = "\"" + val + "\"";
	}
	return val;
};

// Forces a value to be converted to a string
exports.string = function (val) {
	return trim(val.toString());
};

exports.substr = function (val, start, length) {
	return val.substr(_.toNumber(start), _.toNumber(length));
};
exports.substring = function (val, start, end) {
	return val.substring(_.toNumber(start), _.toNumber(end));
};

// Like "join", but uses the "|" special character as the delimiter
// since that character cannot be used as a parameter value
exports.join_pipe = function (val) {
	return val.join("|");
};

// Selects a random value from an array, or selects a random number from 0-num-1, or from min-max
exports.random = function (val) {
	if (_.isArray(val)) {
		var random_index = Math.floor(Math.random() * val.length);
		return val[random_index];
	}
	else {
		if (_.isString(val)) {
			var re = named(/^\s*(?:(:<min>\d+)\s*-\s*)?(:<max>\d+)\s*$/);
			var matches = re.exec(trim(val));
			if (matches) {
				var min = parseInt(matches.captures["min"]) || 0;
				var max = parseInt(matches.captures["max"]);
				if (min > max) {
					throw new Error("min value cannot be larger than max value - " + min + "," + max);
				}

				return Math.floor(Math.random() * ((max + 1) - min) + min);
			}
			else {
				throw new Error("Could not parse value for format specifier, random - " + val);
			}
		}
		else if (_.isNumber(val)) {
			return Math.floor(Math.random() * val);
		}
	}
};

exports.add = function (num, n) {
	if (_.isArray(num)) {
		return _.reduce(num, function (sum, n) {
			return _.toNumber(sum) + _.toNumber(n);
		}, 0);
	}
	return _.toNumber(num) + _.toNumber(n);
};
exports.plus = exports.add;
exports.sum = exports.add;

exports.subtract = function (num, n) {
	if (_.isArray(num)) {
		return _.reduce(num, function (sum, n) {
			return _.toNumber(sum) - _.toNumber(n);
		}, 0);
	}
	return _.toNumber(num) - _.toNumber(n);
};

exports.times = function (num, n) {
	if (_.isArray(num)) {
		return _.reduce(num, function (sum, n) {
			return _.toNumber(sum) * _.toNumber(n);
		}, 0);
	}
	return _.toNumber(num) * _.toNumber(n);
};
exports.product = exports.times;

exports.divided_by = function (num, n) {
	if (_.isArray(num)) {
		return _.reduce(num, function (sum, n) {
			return _.toNumber(sum) / _.toNumber(n);
		}, 0);
	}
	return _.toNumber(num) / _.toNumber(n);
};

exports.average = function (values) {
	if (!_.isArray(values)) {
		throw new Error("Value must be an array");
	}
	return _.reduce(values, function (sum, n) {
		return _.toNumber(sum) + _.toNumber(n);
	}, 0) / values.length;
};
/* Date functions */
/* Use cases:
 1. Produce the current time
 a. <% | now %>
 b. <% | now,UTC %>
 c. <% | now,America/Los_Angeles %>
 2. Produce the current date
 a. <% | day %>
 b. <% | now | day %>
 c. <% | today %>
 3. Parse a value as a date/time (including timezone offset)
 a. <% datefield | date_parse %> # Parse a date string, best-guess format, local timezone
 b. <% datefield | date_parse,YYYY-MM-DD %> # Parse a date string in the format
 c. <% datefield | date_parse,YYYY-MM-DD,America/Los_Angeles %> # Parse a date string in the format with the specified timezone
 d. <% datefield | date_parse,,UTC %> # Parse a string, best-guess format, with the specified timezone
 4. Add/Subtract from a date/time (or the current date)
 a. <% datevalue | date_add,3,months %>
 b. <% datevalue | date_subtract,1,days %>
 5. Format/Print a date/time
 a. <% datevalue | date_format %>
 b. <% datevalue | date_format,YYYY-MM-DD %>
 */

// Returns the current Date
exports.now = function (val, timezone) {
	return get_parser(timezone)();
};
exports.date_now = exports.now;

exports.day = function (val, timezone) {
	return coerce_date(val, timezone).startOf("day");
};

// Formats a date according to the specified moment.js format
exports.date_format = function (val, format, timezone) {
	timezone = trim(timezone);
	format = trim(format);
	val = coerce_date(val, timezone);
	if (!val.isValid()) {
		throw new Error("Could not convert object to date - " + val.toString());
	}
	if (!isEmpty(timezone)) {
		val = val.tz(timezone);
	}
	return val.format(format);
};

exports.date_parse = function (val, format, timezone) {
	timezone = trim(timezone);
	format = trim(format);
	return get_parser(timezone)(val, format);
};
exports.parse_date = exports.date_parse;

function isEmpty(value) {
	return _.isNil(value) || value.trim() == "";
}

function trim(value, default_value) {
	return (value || default_value || "").trim();
}

function get_parser(timezone) {
	if (isEmpty(timezone)) {
		return moment;
	}
	else {
		return _.partialRight(moment.tz, trim(timezone));
	}
}

function coerce_date(val, timezone) {
	if (_.isNil(val)) {
		val = new Date();
	}
	if (val._isAMomentObject) {
		return val;
	}
	if (!(val instanceof Date)) {
		if (_.isString(val)) {
			val = trim(val);
		}
		if (val == "") {
			val = new Date();
		}
		else {
			val = new Date(val);
		}
	}
	var parser = get_parser(timezone);
	return parser(val);
}

exports.today = function (val, timezone) {
	timezone = trim(timezone);
	return exports.day(exports.now(val, timezone));
};


// Formats a date according to the specified moment.js format
exports.utc_format = function utc_format(val, format) {
	format = trim(format);
	return exports.date_format(val, format, "UTC");
};

exports.format_utc = exports.utc_format;

exports.utc_parse = function utc_parse(val, format) {
	format = trim(format);
	return exports.date_parse(val, format, "UTC");
};
exports.parse_utc = exports.utc_parse;

// Adds/subtracts to/from a date
exports.date_add = function (val, count, interval) {
	interval = trim(interval);
	return coerce_date(val).clone().add(parseInt(count), interval);
};

exports.date_subtract = function (val, count, interval) {
	return exports.date_add(val, _.toNumber(count) * -1, interval);
};

exports.start_of = function(val, period) {
	return coerce_date(val).clone().startOf((period || "day").trim());
}

exports.end_of = function(val, period) {
	return coerce_date(val).clone().endOf((period || "day").trim());
}

// Converts a boolean(-ish) value to a real boolean
exports.boolean = function (val) {
	if (typeof(val) === "boolean") {
		return val;
	}
	if (val instanceof Boolean) {
		val = val.valueOf();
	}
	if (_.isString(val)) {
		return val.trim().toLowerCase() === "true";
	}
	else {
		throw Error("Value could not be parsed as boolean - " + val);
	}
};

// Negates a boolean(-ish) value, returning a real boolean.
exports.not = function (val) {
	return !exports.boolean(val);
};

// Returns the "current" item within an array
exports.current = function (val) {
	if (_.isArray(val)) {
		if (!_.has(val, "currentIndex")) {
			val.currentIndex = 0;
		}
		return val[val.currentIndex];
	}
	else {
		return val;
	}
};

// Prints an object out as JSON
exports.json = function (val) {
	return JSON.stringify(val, null, 2);
};

// Calculates a hash value given the algorithm name
exports.hash = function (val, algorithm) {
	algorithm = trim(algorithm);
	var hash = crypto.createHash(algorithm);
	hash.update(val);
	return hash.digest("hex");
};
// Alias for .hash
exports.checksum = exports.hash;

// Hash with "MD5"
exports.md5 = function (val) {
	return exports.checksum(val, "MD5");
};

// Hash with "SHA1"
exports.sha1 = function (val) {
	return exports.checksum(val, "SHA1");
};

/* Encoding functions */
exports.urlencode = encodeURIComponent;
exports.urldecode = decodeURIComponent;

exports.base64encode = function (val) {
	return new Buffer(val).toString("base64");
};
exports.b64encode = exports.base64encode;

exports.base64decode = function (val) {
	return new Buffer(val, "base64").toString();
};
exports.b64decode = exports.base64decode;

// Resolves a relative URL with respect to the specified base url
exports.resolve_url = function (relative, base) {
	relative = trim(relative);
	base = trim(base);
	return url.resolve(base, relative);
};

exports.match = function (val, pattern, options, group) {
	pattern = trim(pattern, ".+");
	options = trim(options);
	group = trim(group);
	var result = new RegExp(pattern, options).exec(val);
	if (!group) {
		return result;
	}
	else {
		return result[parseInt(group)];
	}
};
