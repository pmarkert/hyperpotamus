module.exports.safe = true;
module.exports.manual_interpolation = true;

/*
 Purpose:
 Executes the specified actions for each value in the specified array(s), assigning the array value to the specified key(s). 
 If parallel=true, then the actions will be processed concurrently with each iteration receiving a separate snapshot of the session.

 Example:
- foreach:
    key: item
    in: items
    parallel: true
    actions:
      - goto: token_exchange
 
 */

var _ = require("lodash");
var Promise = require("bluebird");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "foreach")) {
		// Normalize nested actions
		action.foreach.actions = _.map(action.foreach.actions, normalize_action);
		return action;
	}
}

module.exports.process = function (context) {
	var func = (this.foreach.parallel ? Promise.map : Promise.mapSeries);
	return func(context.session[this.foreach.in], item => {
		console.log("Scheduling - " + item);
		var new_context = context.clone();
		new_context.session[this.foreach.key] = item;
		return new_context.process_action(this.foreach.actions).catch(err => {
			if(_.has(err, "goto")) return err.context.handle_directive(err);
			throw err;
		});;
	});
}
