var interpolate = require("../interpolate");
var _ = require("underscore");
var jsdom = require("jsdom");
var jquery = require("jquery");
var async = require("async");

module.exports.name = "jquery";

module.exports.handles = function(action) {
	return _.isString(action.jquery);
}

module.exports.process = function(action, context, callback) {
        var err, compare, value;
        jsdom.env(context.body, function(err, window) {
                if(err) {
                        return callback("Error parsing document - " + err, context.body, null);
                }
                var $ = jquery(window);
                var key = action.key;
                var matches = $(action.jquery);
                if(action.count) {
                        if(_.isNumber(action.count)) {
                                compare = action.count;
                        }
                        else { // Assume _.isString for now. TODO - Error otherwise
                                compare = parseInt(interpolate(action.count, context.session));
                        }
                        if(matches.length!==compare) {
                                return callback("Expected count of matches did not match", compare, matches.length);
                        }
                }
                if(action.capture) {
                        async.eachSeries(matches, function(element, cb) {
                                element = $(element);
                                for(var key in action.capture) {
                                        var target = action.capture[key];
                                        var isArray = false;
                                        if(_.isArray(action.capture[key])) {
                                                isArray = true;
                                                target = target[0];
                                                // TODO - handling for array lengths!=1
                                        }
                                        if(!target || target==="html" || target==="outerHTML") value = element[0].outerHTML;
                                        else if(target==="innerHTML") value = $(element).html();
                                        else if(target==="text") value = $(element).text();
                                        else if(target[0]==="@") value = $(element).attr(target.substring(1));
                                        if(isArray) {
                                                if(!_.isArray(context.session[key])) {
                                                        context.session[key] = [];
                                                }
                                                context.session[key].push(value);
                                        }
                                        else {
                                                context.session[key] = value;
                                        }
                                }
                                cb();
                        }, function(err) {
                                return callback(err, compare, value);
                        });
                }
        });
}
