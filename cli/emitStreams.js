var _ = require("lodash");
var fs = require("fs");

var logger = require("../lib/logging").logger("cli.emitStreams");

/* 
   Different options for --out parameters: 
   1. No --out parameters (all output goes to stdout)
   2. --out <file> (redirect default channel to <file>)
   3. --out.named (redirect named channel to <file>)
 */
module.exports = function(args) {
	var streams = { null: process.stdout };
	if(args.out) {
		/* 
		 Depending upon the order these are specified by the user, yargs handles them differently.
		 Builds a combined key/value hash for each named channel up to the first un-named.
		 Un-named is just a string.
		 Any remaining named channels are a separate key/value hashes (single key each).

		 Example:
 		   "--out.first a --out.second b --out c --out.third d --out.fourth e"
		 yields
		   [ { first: 'a', second: 'b' }, 'c', { third: 'd' }, { fourth: 'e,' } ]
		*/
		args.out = _.castArray(args.out);
		args.out.forEach(out => {
			if(_.isString(out)) {
				streams[null] = fs.createWriteStream(out);
			}
			else {
				out.keys.each(key => {
					streams[key] = fs.createWriteStream(out[key]);
				});
			}
		});
	}
	return function emit(message, channel) {
		var stream = _.isNil(channel) ? streams[null] : streams[channel];
		if(!stream) {
			logger.warn("Emit messages sent to missing channel: ${channel}");
			streams[null].write(`${channel}: ${message}\n`);
		}
		else {
			stream.write(`${message}\n`);
		}
	};
};
