var _ = require("underscore");
var moment = require("moment");

module.exports.name = "moment";

module.exports.safe = true;

/* Date/Duration utility functions */
/* Internally dates are stored as javascript Date objects */

/** Assigning the current date/time */
/*
  moment:
    # Single key to set
    now: key 

    # Single key to set w/utc
    utc_now: key 

    # Array of keys to set
    now: [ key1, key2 ] # or utc_now:
*/

/** Formatting a date - Use the : Date specifier in a <% %> macro */

/** Parsing a date */
/*
  moment:
    # String
    parse: # or utc_parse
      key: '2015-10-01'

    # String w/specific format
    parse: # or utc_parse
      key: 
        value: '2015-10-01'
        format: 'YYYY-MM-DD'

    # Number (unix timestamp seconds)
    parse: 
      key: 1444748531
*/

/** */
/* 
  moment:
    add:
      key:
        date: # key, or defaults to now
	interval: days # or "D"
	count: 3
*/

module.exports.handles = function(action) {
	return _.isObject(action.moment);
}

module.exports.process = function(context) {
	if(!_.isUndefined(this.moment.now)) {
		now(this.moment.now, context, moment);
	}
	if(!_.isUndefined(this.moment.utc_now)) {
		now(this.moment.utc_now, context, moment.utc);
	}
	if(_.isObject(this.moment.parse)) {
		for(var key in this.moment.parse) {
			context.session[key] = parse(this.moment.parse[key], false);
		}
	}
	if(_.isObject(this.moment.utc_parse)) {
		for(var key in this.moment.utc_parse) {
			context.session[key] = parse(this.moment.parse[key], true);
		}
	}
	if(_.isObject(this.moment.add)) {
		for(var key in this.moment.add) {
			context.session[key] = manipulate(this.moment.add[key], true);
		}
	}
	if(_.isObject(this.moment.subtract)) {
		for(var key in this.moment.subtract) {
			context.session[key] = manipulate(this.moment.subtract[key], false);
		}
	}
}
function now(toSet, context, parser) {
	if(_.isString(toSet)) {
		context.session[toSet] = parser();
	}
	else if(_.isArray(toSet)) {
		for(var i=0;i<toSet.length;i++) {
			context.session[toSet[i]] = parser();
		}
	}
	else {
		throw { message : "Unexpected value type for moment.now or moment.utc_now" };
	}
}

function parse(toParse, utcMode) {
	var result = _parse(toParse, utcMode);
	if(!result.isValid()) {
		throw { message : "Could not parse value to a date", toParse: toParse };
	}
	return result;
}

function _parse(toParse, utcMode) {
	if(_.isString(toParse) && isFinite(toParse)) {
		toParse = parseInt(toParse);
	}
	if(_.isNumber(toParse)) {
		if(Math.abs(toParse) <= '9999999999') {
			return moment.unix(toParse);
		}
		else {
			return moment(toParse);
		}
	}
	var parser = utcMode ? moment.utc : moment;
	if(_.isString(toParse)) {
		return parser(toParse);
	}
	if(_.isArray(toParse)) {
		return parser(toParse);
	}
	if(_.isObject(toParse)) {
		if(!_.isString(toParse.value)) {
			throw { message : "Value to parse is invalid (object missing .value property)" };
		}
		if(_.isString(toParse.format)) {
			return parser(toParse.value, toParse.format);
		}
		else {
			return parser(toParse.value);
		}
	}
}

function manipulate(toManipulate, isAdd) {
	var date;
	if(_.isUndefined(toManipulate.date)) {
		date = moment();
	}
	else {
		// TODO - Handle error if the target value isn't a date
		date = moment(context.session[toManipulate.date]);
	}
	// TODO - handle error if .count is not a valid number
	var count = toManipulate.count || 1;
	// TODO - Check for missing/invalid interval
	if(isAdd) {
		return date.add(count, toManipulate.interval);
	}
	else {
		return date.subtract(count, toManipulate.interval);
	}
}
