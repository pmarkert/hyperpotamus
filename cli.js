#!/usr/bin/env node
var hyperpotamus = require("./lib");
var querystring = require("querystring");
var _ = require("underscore");
var csv = require("fast-csv");
var fs = require("fs");
var package = require("./package.json");
var async = require("async");

var args = require("yargs")
	.usage("Run a hyperpotamus script (http://github.com/pmarkert/hyperpotamus)\nUsage: $0")
	.example("$0 filename.yml", "Executes the given script")
	.example("$0 -f filename.yml -e 'Name was <%first%>", "Executes the script, and interpolates the output string")
	.example("$0 filename.yml -e 'Name was <%first%>", "Executes the script, and interpolates the output string")
	.alias("file", "f")
	.describe("file", "YAML script to execute")
	.alias("echo", "e")
	.describe("echo", "Echoes the formatted string after the session")
	.describe("qs", "Initial session state from querystring encoded value")
	.describe("csv", "Loads input data from a csv file (headers on the first line)")
	.count("verbose")
	.alias("verbose","v")
	.describe("output", "Output file of emitted content")
	.alias("output","o")
	.alias("output","out")
	.describe("concurrency", "Number of concurrent requests allowed")
	.alias("concurrency", "c")
	.default("concurrency", 1)
	.describe("handlers", "Folder containing custom action handlers to load in")
	.describe("safe", "Do not allow unsafe YAML types")
	.check(function(args, options) {
		if(!args.file && !args._.length>=1) {
			throw new Error("Must specify the file to process either with -f, --file, or as the first positional argument.");
		}
		else if((args.file && args._.length>0) || args._.length>1) {
			throw new Error("Unexpected positional arguments.");
		}
	})
	.version("hyperpotamus version " + package.version + "\n", "version")
	.strict()
.argv;

if(!args.file) args.file = args._[0];

var session = {};
if(args.qs) {
	session = querystring.parse(args.qs);
}

var outfile;
if(args.output) {
	outfile = fs.createWriteStream(args.output);
}

var loader = hyperpotamus.load.unsafe_yaml;
if(args.safe) {
	loader = hyperpotamus.load.yaml;
}

loader.file(args.file, function(err, script) {
	if(err) { 
		console.log(err); 
		process.exit(1) 
	};
	script = hyperpotamus.normalize(script, options()); // Pre-normalize script if we run it in a loop
	if(args.verbose>=2) {
		console.log("Normalized script is " + JSON.stringify(script));
	}

	if(args.csv) {
		var queue = async.queue(function(user, callback) {
			user = _.defaults(user, session);
			hyperpotamus.process(script, user, options(callback));
		}, args.concurrency);
		csv.fromPath(args.csv, { headers : true }).on("data", function(user) {
			queue.push(user);
		});
	}
	else {
		hyperpotamus.process(script, session, options());
	}
});

function options(master_callback) {
	var handlers;
	if(args.handlers) {
		handlers = hyperpotamus.handlers(args.handlers).concat(hyperpotamus.handlers());
	}

	return {
		handlers : handlers,

		done : function(err, session) {
			if(err) {
				console.error("Error - " + err);
				process.exit(1);
			}
			if(args.verbose)
				console.log("Final session data is " + JSON.stringify(session));
			if(args.echo)
				console.log(hyperpotamus.interpolate(args.echo, session));
			if(master_callback) master_callback();
		},

		before_request : function(request) {
			if(args.verbose) console.log("Requesting - " + request.url);
		},

		before_validate: function(step, context) {
			if(args.verbose>2) console.log("Response was " + context.body);
		},

		after_validate : function(step, err, jump_to_key) {
			if(args.verbose && jump_to_key) console.log("After validation - Jump to key is " + jump_to_key);
		},

		emit : function(message) {
			if(outfile) 
				outfile.write(message + "\n");
			else
				console.log(message);
		}
	}
}
