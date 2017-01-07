#!/usr/bin/env node
var _ = require("lodash");
var querystring = require("querystring");
var csv = require("fast-csv");
var fs = require("fs");
var async = require("async");
var yaml = require("js-yaml");
var hyperpotamus = require("./lib");

var logger = hyperpotamus.logging.logger("hyperpotamus.cli");

var args = require("./args");

// Setup logging configuration
hyperpotamus.logging.set_level(args.verbose + 3); // Starts at Warning, adding --verbose flags bumps to INFO, DEBUG, or TRACE

if (!args.file) {
	args.file = args._[0];
}

var default_session = {};
if (args.qs) {
	// Load in data for the initial session from the qs parameter
	_.forEach(_.castArray(args.qs), function (qs_data) {
		default_session = _.defaultsDeep(default_session, querystring.parse(qs_data));
	});
}
if (args.data) {
	// Load in data for the initial session from any data files (earlier files take precedence)
	_.forEach(_.castArray(args.data), function (data_file) {
		default_session = _.defaultsDeep(default_session, hyperpotamus.yaml.loadFile(data_file, args.safe));
	});
}

// Setup output stream
var outfile = args.output ? fs.createWriteStream(args.output) : process.stdout;

var script;

var plugins_to_load = [];
var auto_load_plugins = false;
if(!_.isNil(args.plugins)) {
	// Check for (and filter true/"true" from args.plugins) to look for "auto-load"
	plugins_to_load = _.without(_.castArray(args.plugins), true, "true");
	auto_load_plugins = plugins_to_load.length < _.castArray(args.plugins).length;
}

var processor = new hyperpotamus.Processor({ safe: args.safe, emit: emit, auto_load_plugins: auto_load_plugins });

try {
	if (plugins_to_load.length) {
		debugger;
		processor.plugins.load(plugins_to_load);
	}
}
catch(ex) {
	console.trace("Error loading plugins - " + ex);
	process.exit(1);
}

try {
	script = processor.loadFile(args.file);
}
catch (ex) {
	console.trace("Error loading yaml script - " + ex);
	process.exit(1);
}


// Pre-normalize script if we run it in a loop and for display/logging
try {
	script = processor.normalize(script);
}
catch (ex) {
	console.trace("Error normalizing script - " + ex);
	process.exit(1);
}

if (args.normalize) {
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
var queue = async.queue(function (session, callback) {
	logger.debug("About to start session for " + JSON.stringify(session));
	// Copy in default session values
	var local_session = _.merge({}, default_session, session);
	processor.process(script, local_session, args.start).then( context => {
		logger.info("Final session data is " + JSON.stringify(context.session, null, 2));
		if (args.echo) {
			console.log(context.interpolate(args.echo));
		}
		if (callback) {
			callback();
		}
	}).catch(err => {
		if(err.action) logger.info("Failed action - \n" + yaml.dump(err.action)); 
		if(err.step) logger.debug("Failed step - \n" + yaml.dump(err.step)); 
		logger.error(`Script processing failed.\n${err.stack || err}`);
		if(err.name) logger.warn(`For more information about this error, see  https://github.com/pmarkert/hyperpotamus/wiki/errors/${err.name}`);
		process.exit(1);
	})
	}, args.concurrency);

// Handler for graceful (or forced) shutdown
var exiting = false;
process.on('SIGINT', function () {
	if (!exiting) {
		exiting = true;
		queue.kill(); // Finish processing in-flight scripts, but stop any new ones from starting
		console.log("Gracefully shutting down from SIGINT (Press Ctrl-C again to exit immediately.)");
	}
	else {
		// Ok, tired of waiting, exit NOW!!
		process.exit();
	}
});

if (args.init) {
	if (args.init === true) {
		args.init = "init";
	}

	// Run the script with the init steps
	processor.process(script, default_session, function (err, context) {
		if (err) {
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
				queue.empty = function () {
				};
			}
		}

		queue.empty = refill;
		refill();
	}
	else {
		logger.trace("Processing script.");
		queue.push({});
	}
}

function emit(message) {
	outfile.write(message + "\n");
}


