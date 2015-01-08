var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.name = "equals";

module.exports.handles = function(validation) {
	return !!(validation.equals);
}

module.exports.process = function(context, callback) {
        var err, compare, value;
        // Array of items that after interpolation should all be equal
        if(_.isArray(context.validation.equals)) {
                for(var i=0; i<context.validation.equals.length; i++) {
                        value = interpolate(context.validation.equals[i], context.session);
                        if(!compare) {
                                compare = value;
                        }
                        else {
                                if(compare!==value) {
                                        err = "Element at position " + i + " did not match comparison value";
                                        break;
                                }
                        }
                }
        }
        else if(_.isObject(context.validation.equals)) {
                for(var key in context.validation.equals) {
                        value = interpolate(context.validation.equals[key], context.session);
                        if(!compare) {
                                compare = value;
                        }
                        else {
                                if(compare!==value) {
                                        err = "Comparison property " + key + " did not match commparison value";
                                        break;
                                }
                        }
                }
        }
        else {
                throw new Error("Could not evaluate equals validation for non array/object type");
        }
        return callback(err, compare, value);
}
