var _ = require("lodash");
var moment = require("moment-timezone");
var crypto = require("crypto");
var url = require("url");
var lib_yaml = require("./yaml");
var zlib = require("zlib");

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
	relative = String(relative).trim();
	base = String(base).trim();
	return url.resolve(base, relative);
};

exports.yaml = function yaml(val) {
	return lib_yaml.dump(val);
};

exports.deflate = function deflate(val) {
	return zlib.deflateSync(val);
}

exports.inflate = function inflate(val) {
	return zlib.inflateSync(val);
}
