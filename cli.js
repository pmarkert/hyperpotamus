#!/usr/bin/env node
var querystring = require("querystring");
var _ = require("underscore");
var csv = require("fast-csv");
var fs = require("fs");
var package = require("./package.json");
var async = require("async");

var args = require("yargs")
	.usage("Run a hyperpotamus script (http://github.com/pmarkert/hyperpotamus)\nUsage: $0")
	.example("$0 filename.yml", "Executes the script in filename.yml")
	.example("$0 -f filename.yml -e 'Name was <%first%>'", "Executes filename.yml script, and prints the results of the interpolated string")
	.example("$0 get_ranking.yml --csv users.csv --qs 'username=admin&password=secret'", "Executes the get_ranking.yml script once for each record in the .csv file")
	.alias("file", "f")
	.describe("file", "The YAML script to be executed")
	.requiresArg("file")
	.alias("echo", "e")
	.describe("echo", "After the script has completed, prints the results of the interpolated string")
	.requiresArg("echo")
	.describe("qs", "Query-string encoded initial session state. HINT: enclose in '' to prevent special characters from being processed by the shell")
	.requiresArg("qs")
	.describe("csv", "Load session state data from a csv file (headers on the first line) and execute the script once for each record")
	.requiresArg("csv")
	.count("verbose")
	.alias("verbose","v")
	.describe("verbose", "Verbose output, more flags for more output i.e. -vvv")
	.describe("output", "Output file for emitted content. See documentation on the emit action.")
	.requiresArg("output")
	.alias("output","o")
	.alias("output","out")
	.describe("concurrency", "Maxiumum number of parallel script executions for script execution. Only effective if using --csv or --repeat.")
	.requiresArg("concurrency")
	.alias("concurrency", "c")
	.default("concurrency", 1)
	.describe("plugins", "Folder containing custom plugins to be loaded")
	.requiresArg("plugins")
	.describe("safe", "Do not allow unsafe YAML types or plugins")
	.boolean("safe")
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

var hyperpotamus = require("./lib").processor(args.safe);
if(args.plugins) {
	if(!_.isArray(args.plugins)) args.plugins = [ args.plugins ];
	for(var i=0; i<args.plugins.length; i++) {
		hyperpotamus.use(args.plugins[i], args.safe);
	}
}

var script = hyperpotamus.load.scripts.yaml.file(args.file, args.safe);
script = hyperpotamus.normalize(script); // Pre-normalize script if we run it in a loop
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

function options(master_callback) {
	return {
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
