var verror = require("verror");

module.exports = function validateVError(name) {
	return function (err) {
		return err instanceof verror.VError && err.name == name;
	};
};
