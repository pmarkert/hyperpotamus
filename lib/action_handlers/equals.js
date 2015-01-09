var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.name = "equals";

module.exports.handles = function(action) {
	return _.isArray(action.equals) || _.isObject(action.equals);
}

module.exports.process = function(action, context, callback) {
        var err, compare, value;
        // Array of items that after interpolation should all be equal
        if(_.isArray(action.equals)) {
                for(var i=0; i<action.equals.length; i++) {
                        value = interpolate(action.equals[i], context.session);
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
        else if(_.isObject(action.equals)) {
                for(var key in action.equals) {
                        value = interpolate(action.equals[key], context.session);
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
                throw new Error("Could not evaluate equals for non array/object type");
        }
        return callback(err, compare, value);
}
