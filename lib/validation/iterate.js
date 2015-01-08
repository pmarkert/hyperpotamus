var interpolate = require("../interpolate");
var _ = require("underscore");

module.exports.handles = function(validation) {
	return !!(validation.iterate);
}

module.exports.process = function(context) {
        var reached_end = false;
        for(var i=0; i<context.validation.iterate.length; i++) { // Increment the .index for each array in the array of [iterate]
                if(!_.isArray(context.session[context.validation.iterate[i]])) { // If it's not an array, pretend it's an array of one (and jump right away)
                        reached_end = true;
                }
                else {
                        if(!context.session[context.validation.iterate[i] + ".index"] ) { // This is the first time, so the index was 0 before incrementing
                                context.session[context.validation.iterate[i] + ".index"] = 0;
                        }
                        if(context.session[context.validation.iterate[i] + ".index"] < context.session[context.validation.iterate[i]].length - 1) { // If we still have elements
                                context.session[context.validation.iterate[i] + ".index"]++;
                        }
                        else { // We reached the end
                                delete(context.session[context.validation.iterate[i]+".index"]);
                                reached_end = true;
                        }
                }
        }
        // We return an error to cause a to jump_to_key(on_failure). If we reached the end, return success (complete) to move on
        if(reached_end) { return context.callback(); }
        else { return context.callback("Iteration"); }
}
