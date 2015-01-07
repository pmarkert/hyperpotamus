var _ = require("underscore");
var moment = require("moment");

module.exports = function(string, data) {
	return string.replace(/<%([=+\-:\?@]*)\s*(.+?)(\|(.*?))?\s*%>/g, function(match, options, key, ignore, parameters, offset, string) {
		var url_encode_level = 0;
		var optional = false;
		var date_format = false;
		var array_access = false;
		if(options) {
			for(var i=0;i<options.length;i++) {
				switch(options[i]) {
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
				}
			}
		}
		var value;
		if(date_format) {
			value = moment().format(key);
		}
		else if(array_access && _.isArray(data[key])) {
			if(!_.has(data, key + ".index")) {
				data[key + ".index"] = 0;
			}
			value = data[key][data[key + ".index"]];
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
