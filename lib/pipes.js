var _ = require("lodash");
var moment = require("moment");
var crypto = require("crypto");
var named = require("named-regexp").named;
var url = require("url");

exports.optional = function (val, replacement) {
	return _.isUndefined(val) ? _.defaultTo(replacement,"").trim() : val.trim();
}

exports.csv_safe = function (val) {
	val = val.toString().trim().split("\"").join("\\\"");
	if (val.indexOf(",") >= 0) {
		val = "\"" + val + "\"";
	}
	return val;
}

// Forces a value to be converted to a string
exports.string = function (val) {
	return val.toString().trim();
};

exports.substr = function (val, start, length) {
	return val.substr(_.toNumber(start), _.toNumber(length));
}
exports.substring = function (val, start, end) {
	return val.substring(_.toNumber(start), _.toNumber(end));
}

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
			var matches = re.exec(val.trim());
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

exports.divided_by = function (num, n) {
	return _.toNumber(num) / _.toNumber(n);
};

/* Date functions */

// Returns the current Date
exports.now = function () {
	return moment();
};

// Formats a date according to the specified moment.js format
exports.date_format = function (val, format) {
	return date_format(val, format, moment);
};

// Formats a date according to the specified moment.js format
exports.utc_format = function (val, format) {
	return date_format(val, format, moment.utc);
};

function coerce_date(val) {
	if (!val._isAMomentObject) {
		// Is it a date?
		if (!(val instanceof Date)) {
			if(_.isString(val)) {
				val = val.trim();
			}
			val = new Date(val);
		}
		val = parser(val);
		if (!val.isValid()) {
			throw new Error("Could not convert object to date - key:" + key);
		}
	}
	return val;
}

function date_format(val, format, parser) {
	if (format) {
		format = format.trim();
	}
	return coerce_date(val).format(format);
};

exports.date_parse = function (val, format) {
	return moment(val.trim(), format.trim());
};

exports.utc_parse = function (val, format) {
	return moment.utc(val.trim(), format.trim());
};

// Adds/subtracts to/from a date
exports.date_add = function (val, count, interval) {
	return coerce_date(val).add(parseInt(count), interval.trim());
};

exports.date_subtract = function (val, count, interval) {
	return exports.date_add(val, _.toNumber(count) * -1, interval);
};

// Converts a boolean(-ish) value to a real boolean
exports.boolean = function (val) {
	if (typeof(val) === "boolean") {
		return val;
	}
	if (val instanceof Boolean) {
		val = val.valueOf();
	}
	if (val == "true") {
		return true;
	} else if (val == "false") {
		return false;
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
	var hash = crypto.createHash(algorithm.trim());
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
	return new Buffer(val).toString('base64');
};
exports.b64encode = exports.base64encode;

exports.base64decode = function (val) {
	return new Buffer(val, 'base64').toString();
};
exports.b64decode = exports.base64decode;

// Resolves a relative URL with respect to the specified base url
exports.resolve_url = function (base, relative) {
	return url.resolve(base, relative.trim());
};
