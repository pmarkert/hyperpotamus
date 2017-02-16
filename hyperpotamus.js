#!/usr/bin/env node
/* eslint-disable no-console */
var _ = require("lodash");
var csv = require("fast-csv");
var async = require("async");
var yaml = require("js-yaml");
var hyperpotamus = require("./lib");
var verror = require("verror");
var Promise = require("bluebird");

var defaultConfigFile = require("path").join(require("os").homedir(), ".hyperpotamus", "config.json");
var args = require("./cli/args")(defaultConfigFile);

// Setup logging configuration
var logger = hyperpotamus.logging.logger("hyperpotamus.cli");
hyperpotamus.logging.set_level(args.verbose + 3); // Starts at Warning, adding --verbose flags bumps to INFO, DEBUG, or TRACE

if(args.calfinated) {
	process.env.CALFINATED = "true";
}
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
	catch (err) {
		dumpError("loading plugins", err);
	}

	var script;
	try {
		script = processor.loadFile(args.file);
	}
	catch (err) {
		dumpError("loading yaml script", err);
	}

	// Pre-normalize script if we run it in a loop and for display/logging
	try {
		script = processor.normalize(script);
		logger.trace("Normalized script:\n" + yaml.dump(script));
		if (args.normalize) {
			showNormalized(script);
			process.exit(0);
		}
	}
	catch (err) {
		dumpError("normalizing script", err);
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
				dumpError("processing script", err);
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
					dumpError("processing init script", err);
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

function dumpError(message, err) {
	var cause = findCause(err);
	var dump = {
		name: cause.name,
		message: cause.message
	};
	var path = findDeepestInfoProperty(err, "path");
	if(!_.isNil(path)) {
		dump.path = path;
	}
	dump.help_link = `https://github.com/pmarkert/hyperpotamus/wiki/errors#${cause.name}`;
	logger.debug(`Error stack-trace:\n${verror.fullStack(err)}`);
	logger.info(`Error details:\n${yaml.dump(verror.info(err), { noRefs: true, lineWidth: process.stdout.columns, skipInvalid: true })}`);
	logger.error(`Error occurred while ${message}:\n${yaml.dump(dump, { noRefs: true, lineWidth: process.stdout.columns, skipInvalid: true })}`);
	process.exit(1);
}

function findCause(err) {
	var next;
	while((next = verror.cause(err))!=null) {
		if(next instanceof verror.VError) {
			err = next;
		}
		else {
			break;
		}
	}
	return err;
}

function findDeepestInfoProperty(err, property) {
	if(err instanceof verror.VError) {
		var result = findDeepestInfoProperty(verror.cause(err), property);
		return result || verror.info(err)[property];
	}
	return null;
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
}
