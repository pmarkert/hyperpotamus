var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.name = "iterate";

module.exports.safe = true;

module.exports.normalize = function(action) {
	if(action.iterate) {
		// For the iterate command, on_failure is used to jump at each step
		if(action.next && !action.on_failure) { // Rename next to on_failure
			action.on_failure = action.next;
			delete(action.next);
		}
		if(!action.on_failure) action.on_failure = "SELF";
		if(!_.isArray(action.iterate)) {
			action.iterate = [ action.iterate ];
		}
		return action;
	}
}

module.exports.handles = function(action) {
	return _.isArray(action.iterate);
}

module.exports.process = function(action, context, callback) {
        var reached_end = false;
        for(var i=0; i<action.iterate.length; i++) { // Increment the .index for each array in the array of [iterate]
                if(!_.isArray(context.session[action.iterate[i]])) { // If it's not an array, pretend it's an array of one (and jump right away)
                        reached_end = true;
                }
                else {
                        if(!context.session[action.iterate[i] + ".index"] ) { // This is the first time, so the index was 0 before incrementing
                                context.session[action.iterate[i] + ".index"] = 0;
                        }
                        if(context.session[action.iterate[i] + ".index"] < context.session[action.iterate[i]].length - 1) { // If we still have elements
                                context.session[action.iterate[i] + ".index"]++;
                        }
                        else { // We reached the end
                                delete(context.session[action.iterate[i]+".index"]);
                                reached_end = true;
                        }
                }
        }
        // We return an error to cause a to jump_to_key(on_failure). If we reached the end, return success (complete) to move on
        if(reached_end) { return callback(); }
        else { return callback("Iteration"); }
}
