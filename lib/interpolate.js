var _ = require("underscore");
var moment = require("moment");
var named = require("named-regexp").named;

function interpolate_string(string, data) {
	return string.replace(/<%(%?[#=+\-:\?@&\$]*)\s*(.+?)(\|(.*?))?\s*%>/g, function(match, options, key, ignore, parameters, offset, string) {
		var url_encode_level = 0;
		var optional = false;
		var date_format = false;
		var array_access = false;
		var array_join = false;
		var random_value = false;
		var delimiter_quote = false;
		if(options) {
			for(var i=0;i<options.length;i++) {
				switch(options[i]) {
					case '%': // Literal escape, do not replace anything
						return "<%" + match.substring(3);
					case '+':
						url_encode_level++;
						break;
					case '-':
						url_encode_level--;
						break;
					case '?':
						optional = true;
						break;
					case ':':
						date_format = true;
						break;
					case "@":
						array_access = true;
						break;
					case "&":
						array_join = true;
						break;
					case "$":
						random_value = true;
						break;
					case "#":
						delimiter_quote = true;
						break;
				}
			}
		}
		var value;
		if(date_format) {
			value = moment().format(key);
		}
		else if(array_join) {
			if(parameters) {
				parameters = parameters
					.replace("\\t","\t")
					.replace("\\n","\n")
					.replace("\\s"," ");
			}
			if(_.isArray(data[key]))
				value = data[key].join(parameters);
			else
				value = data[key];
		}
		else if(random_value) {
			// <%$@ array %> - Random element from array
			if(array_access) {
				if(_.has(data, key)) {
					if(_.isArray(data[key])) {
						var random_index = Math.floor(Math.random() * data[key].length);
						value = data[key][random_index];
					}
					else {
						value = data[key];
					}
				}
				else {
					if(optional) {
						value = parameters;
					}
					else {
						throw new Error("Array not found for random selection");
					}
				}
			}
			else {
				// <%$ 3000-5000 %> - Random number in range min to max-1
				// <%$ 5000 %> - Random number from 0 to max-1
				var re = named(/^\s*(?:(:<min>\d+)\s*-\s*)?(:<max>\d+)\s*$/);
				var matches = re.exec(key);
				if(matches) {
					var min = parseInt(matches.captures["min"]) || 0;
					var max = parseInt(matches.captures["max"]);
					if(min>max) throw new Error("min value cannot be larger than max value - " + min + "," + max);
					if(min==max) throw new Error("min value cannot be the same as max value - " + min + "," + max);
				
					value = Math.floor(Math.random() * (max - min) + min);
					return value;
				}
				else {
					throw new Error("Could not parse value for format specifier, random - " + key);
					
				}
			}
		}
		else if(array_access && _.isArray(data[key])) {
			if(parameters) {
				if(parseInt(parameters)>=data[key].length)
					throw new Error("Array index out of bounds for " + key + ", index=" + parseInt(parameters));
				else
					value = data[key][parseInt(parameters)];
			}
			else {
				if(!_.has(data, key + ".index")) {
					data[key + ".index"] = 0;
				}
				if(parseInt(data[key + ".index"])>=data[key].length)
					throw new Error("Array index out of bounds for " + key + ", index=" + parseInt(data[key + ".index"]));
				else
					value = data[key][data[key + ".index"]];
			}
		}
		else {
			if(_.has(data, key))
				value = data[key];
			else {
				if(optional)
					value = parameters ? parameters : "";
				else
					throw new Error("No value found for non-optional replacement " + key);
			}
		}
		if(delimiter_quote) {
			// Right now, if you combine with other features that use parameters, we're gonna have issues
			var delimiter = parameters || ",";
			if(value && value.indexOf(delimiter)>=0) {
				value = '"' + value + '"';
			}
		}
		while(url_encode_level>0) {
			value = encodeURIComponent(value);
			url_encode_level--;
		}
		while(url_encode_level<0) {
			value = decodeURIComponent(value);
			url_encode_level++;
		}
		return value;
	});
}

module.exports = function(object, data) {
	function interpolate_tree(object) {
		if(_.isString(object)) {
			return interpolate_string(object, data);
		}
		if(_.isArray(object)) {
			return _.map(object, interpolate_tree);
		}
		if(_.isObject(object) && !_.isFunction(object)) {
			var result = {};
			for(var key in object) {
				result[key] = interpolate_tree(object[key]);
			}
			return result;
		}
		return object;
	};

	return interpolate_tree(object);
}
