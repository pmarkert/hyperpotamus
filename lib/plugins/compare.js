var _ = require("underscore");
var logger = require("../logging").logger("hyperpotamus.plugins.compare");

module.exports.name = "compare";

module.exports.safe = true;

module.exports.normalize = function(action) {
	if(action.equals) {
		logger.trace("Normalizing 'equals' to compare");
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
	logger.debug("About to compare values - " + JSON.stringify(compare) + operator + JSON.stringify(value));
	if(!isNaN(compare)) {
		logger.debug("Coercing comparison value to numeric.");
		compare = +compare;
	}
	switch(operator) {
		case "=":
		case "==":
		case "===":
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
		case "!==":
		case "<>":
			return compare != value;
		default:
			throw new Error("Unknown comparison operator");
			
	}
}

module.exports.process = function(context, callback) {
	if(this.debugger) debugger;
        var err, compare, value;
        // Array of items that should all be equal
        if(_.isArray(this.compare)) {
                for(var i=0; i<this.compare.length; i++) {
                        value = this.compare[i];
                        if(!compare) {
                                compare = value;
                        }
                        else {
                                if(!compare_values(compare,value,this.operator)) {
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
