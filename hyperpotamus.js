#!/usr/bin/env node
/* eslint-disable no-console */
var _ = require("lodash");
var csv = require("fast-csv");
var fs = require("fs");
var async = require("async");
var yaml = require("js-yaml");
var hyperpotamus = require("./lib");
var verror = require("verror");
var Promise = require("bluebird");

var args = require("./cli/args");

// Setup logging configuration
var logger = hyperpotamus.logging.logger("hyperpotamus.cli");
hyperpotamus.logging.set_level(args.verbose + 3); // Starts at Warning, adding --verbose flags bumps to INFO, DEBUG, or TRACE

execute(args);

function execute(args) {
	var sessionDefaults = require("./cli/sessionDefaults.js")(args);
	var emitStreams = require("./cli/emitStreams.js")(args);

	var plugins_to_load = [];
	var auto_load_plugins = false;
	if (!_.isNil(args.plugins)) {
		// Check for (and filter true/"true" from args.plugins) to look for "auto-load"
		plugins_to_load = _.without(_.castArray(args.plugins), true, "true");
		auto_load_plugins = plugins_to_load.length < _.castArray(args.plugins).length;
	}

	var processor = new hyperpotamus.Processor({ safe: args.safe, emit: emitStreams, auto_load_plugins: auto_load_plugins });

	try {
		if (plugins_to_load.length) {
			processor.plugins.load(plugins_to_load);
		}
	}
	catch (ex) {
		console.trace("Error loading plugins - " + ex);
		process.exit(1);
	}

	var script;
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
		logger.trace("Normalized script:\n" + yaml.dump(script));
		if (args.normalize) {
			showNormalized(script);
		}
	}
	catch (ex) {
		logger.error("Error normalizing script - " + ex);
		logger.info(ex.stack);
		process.exit(1);
	}

	// Worker queue to process requests with set concurrency
	var queue = async.queue(function (session, callback) {
		logger.debug("About to start session for " + JSON.stringify(session));
		var localSession = _.merge({}, sessionDefaults, session);
		processor.process(script, localSession, args.start)
			.tap(context => logger.info("Final session data is:\n" + JSON.stringify(context.session, null, 2)))
			.delay(0) // To ensure we can SIGINT even if no async work happens in the script
			.then(callback)
			.catch(err => {
				logger.debug(`Error stack-trace:\n${verror.fullStack(err)}`);
				var info = verror.info(err);
				if (info) {
					logger.info(`Additional error metadata:\n${yaml.dump(info, { noRefs: true }).trim()}`);
				}
				if (err.name) {
					logger.warn(`For more information about this error, see\n  https://github.com/pmarkert/hyperpotamus/wiki/errors#${err.name}`);
				}
				logger.error(`Script processing failed.\n${err}`);
				process.exit(1);
			});
	}, args.concurrency);

	// Handler for graceful (or forced) shutdown
	var exiting = false;
	process.on("SIGINT", function () {
		if (!exiting) {
			exiting = true;
			queue.kill(); // Finish processing in-flight scripts, but stop any new ones from starting
			console.log("Gracefully shutting down from SIGINT (Press Ctrl-C again to exit immediately.)");
		}
		else {
			// Ok, tired of waiting, exit NOW!!
			process.exit(1);
		}
	});


	Promise.try(() => {
		if (args.init) {
			if (args.init === true) {
				args.init = "init";
			}

			// Run the script with the init steps
			return processor.process(script, sessionDefaults, args.init)
				.then(context => context.session)
				.catch(err => {
					console.error("Error running init session - " + JSON.stringify(err, null, 2));
					throw new verror.VError({ name: "InitException", cause: err }, `Error running initialization - ${err}`);
				});
		}
		return sessionDefaults;
	}).then(defaults => {
		sessionDefaults = defaults;
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
			queue.empty = () => {
				for (var i = 0; i < args.concurrency && (args.loop == true || iterations < args.loop); i++) {
					iterations++;
					queue.push({ "hyperpotamus.index": iterations });
					logger.trace("Queued user for processing #" + iterations);
				}
				if (args.loop === iterations) {
					// As soon as we have enough iterations, stop the refill. if args.loop == true it will never stop.
					queue.empty = _.noop;
				}
			};
			// Start filling
			queue.empty();
		}
		else {
			logger.trace("Processing script.");
			queue.push({});
		}
	});
}

function showNormalized(script) {
	console.log(`
Normalized JSON:
================
${JSON.stringify(script, null, 2)}

Normalized YAML:
================
${yaml.dump(script)}
`);
	logger.info("Exiting without processing script.");
	process.exit(0);
}
