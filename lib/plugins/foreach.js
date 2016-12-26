module.exports.safe = true;
module.exports.manual_interpolation = true;

/*
 Purpose:
 Executes the specified actions for each value in the specified array(s), assigning the array value to the specified key(s). 
 If parallel=true, then the actions will be processed concurrently with each iteration receiving a separate snapshot of the session.

 Example:
- foreach:
    key: [ item, ad ]
    in: [ items, ads ]
    parallel: true
    actions:
      - goto: token_exchange
 
 */

var _ = require("lodash");
var Promise = require("bluebird");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "foreach")) {
		// Normalize nested actions
		action.foreach.key = _.castArray(action.foreach.key);
		action.foreach.in = _.castArray(action.foreach.in);
		action.foreach.actions = normalize_action(action.foreach.actions);
		return action;
	}
}

module.exports.process = function (context) {
	var func = (this.foreach.parallel ? Promise.map : Promise.mapSeries);
	this.foreach.in = this.foreach.in.map(a => _.isArray(a) ? a : context.session[a]);
	return func(_.zip.apply(null, this.foreach.in), (parts) => {
		var new_context = context.clone();
		var new_part = _.zipObject(this.foreach.key, parts);
		exports.logger.debug("Forking with " + JSON.stringify(new_part));
		_.assign(new_context.session, new_part);
		return new_context.process_action(this.foreach.actions).catch(err => {
			if(_.has(err, "goto")) return err.context.handle_directive(err);
			throw err;
		});;
	});
}
