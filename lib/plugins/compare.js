var _ = require("underscore");

module.exports.name = "compare";

module.exports.safe = true;

module.exports.normalize = function(action) {
	if(action.equals) {
		action.operator = "=";
		action.compare = action.equals;
		delete(action.equals);
		return action;
	}
	else if(action.compare) {
		if(!action.operator)
			action.operator = "=";
		return action;
	}
}

module.exports.handles = function(action) {
	return _.isArray(action.compare) || _.isObject(action.compare);
}

function compare_values(compare, value, operator) {
	if(!isNaN(compare))
		compare = +compare;
	switch(operator) {
		case "=":
		case "==":
			return compare == value;
		case "<":
			return compare < value;
		case "<=":
			return compare <= value;
		case ">":
			return compare > value;
		case ">=":
			return compare >= value;
		case "!=":
		case "<>":
			return compare != value;
		default:
			throw new Error("Unknown comparison operator");
			
	}
}

module.exports.process = function(action, context, callback) {
        var err, compare, value;
        // Array of items that should all be equal
        if(_.isArray(action.compare)) {
                for(var i=0; i<action.compare.length; i++) {
                        value = action.compare[i];
                        if(!compare) {
                                compare = value;
                        }
                        else {
                                if(!compare_values(compare,value,action.operator)) {
                                        err = "Element at position " + i + " did not match comparison value";
                                        break;
                                }
				compare = value;
                        }
                }
        }
        else {
                throw new Error("Comparison target must be an array");
        }
        return callback(err, compare, value);
}
