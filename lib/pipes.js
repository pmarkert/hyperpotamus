var moment = require("moment");
var crypto = require("crypto");
var _ = require("underscore");
var named = require("named-regexp").named;

// Used to pass a literal string along (useful when it's the first filter)
exports.literal = function(val, literal) {
	return literal.trim();
}

exports.string = function(val) {
	return val.toString();
}

exports.random = function(val) {
	if(_.isArray(val)) {
		var random_index = Math.floor(Math.random() * val.length);
		return val[random_index];
	}
	else {
		if(_.isString(val)) {
			var re = named(/^\s*(?:(:<min>\d+)\s*-\s*)?(:<max>\d+)\s*$/);
			var matches = re.exec(val);
			if(matches) {
				var min = parseInt(matches.captures["min"]) || 0;
				var max = parseInt(matches.captures["max"]);
				if(min>max) throw new Error("min value cannot be larger than max value - " + min + "," + max);

				return Math.floor(Math.random() * ((max+1) - min) + min);
			}
			else {
				throw new Error("Could not parse value for format specifier, random - " + val);
			}
		}
		else if(_.isNumber(val)) {
			return Math.floor(Math.random() * val);
		}
	}
};

/* Date functions */

// Returns the current Date
exports.now = function() {
	return new Date();
}

// Formats a date according to format
exports.format_date = function(val, format) {
	if(!val._isAMomentObject) {
		// Is it a date?
		if(!(val instanceof Date)) {
			val = new Date(val);
		}
		val = moment(val);
		if(!val.isValid()) {
			throw new Error("Could not convert object to date - key:" + key);
		}
	}
	if(format) { format = format.trim(); }
	return val.format(format);
};
exports.date_format = exports.format_date;

// Adds/subtracts to/from a date
exports.date_add = function(val, count, interval) {
	if(!val._isAMomentObject) {
		// Is it a date?
		if(!(val instanceof Date)) {
			val = new Date(val);
		}
		val = moment(val);
		if(!val.isValid()) {
			throw new Error("Could not convert object to date - key:" + key);
		}
	}
	return val.add(parseInt(count), interval.trim());
};
exports.date_subtract = function(val, count, interval) {
	return exports.date_add(val, -(parseInt(count)), interval);
}

exports.boolean = function(val) {
	if(typeof(val)==="boolean") {
		return val;
	}
	if(val instanceof Boolean) {
		val = val.valueOf();
	}
	if(val=="true") {
		return true;
	} else if (val=="false") {
		return false;
	}
	else throw Error("Value could not be parsed as boolean - " + val);
}

exports.not = function(val) {
	return !exports.boolean(val);
}

/* Array/Iteration Functions */

// Returns the "current" item within an array
exports.current = function(val) {
	if(_.isArray(val)) {
		if(!_.has(val, "currentIndex")) {
			val.currentIndex = 0;
		}
		return val[val.currentIndex];
	}
	else {
		return val;
	}
};

/* JSON Pretty-printing */
exports.json = function(val) {
	return JSON.stringify(val, null, 2);
}

/* Checksums */

exports.hash = function(val, algorithm) {
        var hash = crypto.createHash(algorithm.trim());
        hash.update(val);
        return hash.digest("hex");
}
exports.checksum = exports.hash;

exports.md5 = function(val) {
	return exports.checksum(val, "MD5");
}

exports.sha1 = function(val) {
	return exports.checksum(val, "SHA1");
}

/* Encoding functions */

exports.urlencode = encodeURIComponent;
exports.urldecode = decodeURIComponent;

exports.base64encode = function(val) {
	return new Buffer(val).toString('base64');
}
exports.b64encode = exports.base64encode;

exports.base64decode = function(val) {
	return new Buffer(val, 'base64').toString();
}
exports.b64decode = exports.base64decode;
