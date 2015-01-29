#!/usr/bin/env node
var querystring = require("querystring");
var _ = require("underscore");
var csv = require("fast-csv");
var fs = require("fs");
var package = require("./package.json");
var async = require("async");
var yaml = require("js-yaml");
var log4js = require("log4js");
var logger = log4js.getLogger("hyperpotamus");

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
	.describe("qs", "Query-string encoded initial session state. HINT: enclose in '' to prevent special characters like & from being processed by the shell")
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
	.describe("normalize", "Display the normalized version of the input script and then immediately exit (does not execute script)")
	.boolean("normalize")
	.describe("safe", "Do not allow unsafe YAML types or plugins")
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

// Setup log4js configuration
switch(args.verbose) {
	case 4:
		level = "DEBUG";
		break;
	case 3:
		level = "INFO";
		break;
	case 2:
		level = "WARN";
		break;
	case 1:
		level = "ERROR";
		break;
	case 0:
		level = "FATAL";
		break;
	default:
		level = "TRACE";
		break;
}
log4js.configure( { appenders: [ { type : 'console' } ] } );
log4js.setGlobalLogLevel(level);

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
if(args.normalize) {
	console.log("Normalized YAML:");
	console.log("================");
	console.log(yaml.dump(script));
	console.log("");
	console.log("Normalized JSON:");
	console.log("================");
	console.log(JSON.stringify(script, null, 2));
	process.exit(0);
}
logger.debug("Script normalized as YAML:");
logger.debug(yaml.dump(script));
logger.debug("Script normalized JSON:");
logger.debug(JSON.stringify(script, null, 2));

if(args.csv) {
	logger.info("Loading data from csv file - " + args.csv);
	logger.info("Maximum concurrency level is " + args.concurrency);
	var queue = async.queue(function(user, callback) {
		user = _.defaults(user, session);
		hyperpotamus.process(script, user, options(callback));
	}, args.concurrency);
	csv.fromPath(args.csv, { headers : true }).on("data", function(user) {
		queue.push(user);
		logger.debug("Queued user for processing %s", JSON.stringify(user));
	});
}
else {
	logger.info("Processing script.");
	hyperpotamus.process(script, session, options());
}

function options(master_callback) {
	return {
		done : function(err, context) {
			if(err) {
				console.error("Error - " + err);
				process.exit(1);
			}
			logger.info("Final session data is %s", JSON.stringify(context.session));
			if(args.echo)
				console.log(hyperpotamus.interpolate(args.echo, context.session));
			if(master_callback) master_callback();
		},

		emit : function(message) {
			if(outfile)
				outfile.write(message + "\n");
			else
				console.log(message);
		}
	}
}
