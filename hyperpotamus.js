#!/usr/bin/env node
var _ = require("lodash");
var querystring = require("querystring");
var csv = require("fast-csv");
var fs = require("fs");
var async = require("async");
var yaml = require("js-yaml");
var hyperpotamus = require("./lib/processor");
var logging = require("./lib/logging");

var logger = logging.logger("hyperpotamus.cli");

var args = require("./args");

// Setup logging configuration
logging.set_level(args.verbose+3); // Starts at Warning, adding --verbose flags bumps to INFO, DEBUG, or TRACE

if(!args.file) {
	args.file = args._[0];
}

var default_session = {};
if(args.qs) {
	// Load in data for the initial session from the qs parameter
	default_session = _.merge(querystring.parse(args.qs), default_session);
}
if(args.data) {
	// Load in data for the initial session from any data files (earlier files take precedence)
	args.data = _.isArray(args.data) ? args.data : [ args.data ];
	for(var i=0;i<args.data.length;i++) {
	  default_session = _.merge(yaml.load(fs.readFileSync(args.data[i])), default_session);
	}
}

// Setup output stream
var outfile = args.output ? fs.createWriteStream(args.output) : process.stdout;

var processor = hyperpotamus.processor( { safe : args.safe, plugins : args.plugins, emit : emit } );
var script = processor.load.scripts.yaml.file(args.file);
// Pre-normalize script if we run it in a loop and for display/logging
try {
	script = processor.normalize(script); 
}
catch(ex) {
	if(ex.message) {
		console.log(ex.message);
	}
	else {
		console.log(ex);
	}
	process.exit(1);
}
if(args.normalize) {
	console.log("Normalized YAML:");
	console.log("================");
	console.log(yaml.dump(script));
	console.log("");
	console.log("Normalized JSON:");
	console.log("================");
	console.log(JSON.stringify(script, null, 2));
	console.log("");
	console.log("Exiting without processing script.");
	process.exit(0);
}
logger.debug("Script normalized as YAML:\n" + yaml.dump(script));
logger.debug("Script normalized JSON:\n" + JSON.stringify(script, null, 2));

// Worker queue to process requests with set concurrency
var queue = async.queue(function(session, callback) {
	logger.debug("About to start session for " + JSON.stringify(session));
	// Copy in default session values
	var local_session = _.merge({}, default_session, session);
	processor.process(script, local_session, options(callback), args.start);
}, args.concurrency);

// Handler for graceful (or forced) shutdown
var exiting = false;
process.on('SIGINT', function() {
	if(!exiting) {
		exiting = true;
		queue.kill(); // Finish processing in-flight scripts, but stop any new ones from starting
		console.log("Gracefully shutting down from SIGINT (Press Ctrl-C again to exit immediately.)" );
	}
	else {
		// Ok, tired of waiting, exit NOW!!
		process.exit();
	}
});

if(args.init) {
	if(args.init === true) {
		args.init = "init";
	}

	// Run the script with the init steps
	processor.process(script, default_session, function(err, context) {
		if(err) {
			console.error("Error running init session - " + JSON.stringify(err, null, 2));
			process.exit(1);
		}
		run();
	}, args.init);
}
else {
	run();
}

function run() {
	if (args.csv) {
		logger.info("Loading data from csv file - " + args.csv);
		logger.info("Maximum concurrency level is " + args.concurrency);
		csv.fromPath(args.csv, { headers: true }).on("data", function (user) {
			if (!exiting) {
				queue.push(user);
				logger.trace("Queued user for processing " + JSON.stringify(user));
			}
		});
	}
	else if (args.loop) {
		var iterations = 0;
		// fill the queue up to max concurrency and whenever the queue is emptied (but still processing the current items), keep refilling until
		// we have finished. This prevents having to pre-queue a large (or potentially infinite) number of entries.
		function refill() {
			for (var i = 0; i < args.concurrency && (args.loop == true || iterations < args.loop); i++) {
				iterations++;
				queue.push({ "hyperpotamus.index": iterations });
				logger.trace("Queued user for processing #" + iterations);
			}
			if (args.loop == iterations) {
				// As soon as we have enough iterations, stop the refill. if args.loop == true it will never stop.
				queue.empty = null;
			}
		}

		queue.empty = refill;
		refill();
	}
	else {
		logger.info("Processing script.");
		queue.push({});
	}
}

function emit(message) {
	outfile.write(message + "\n");
}

function options(master_callback) {
	return function(err, context) {
		if(err) {
			console.error("Error - " + JSON.stringify(err, null, 2));
			process.exit(1);
		}
		logger.info("Final session data is " + JSON.stringify(context.session, null, 2));
		if(args.echo)
			console.log(processor.interpolate(args.echo, context.session));
		if(master_callback) master_callback();
	};
}
