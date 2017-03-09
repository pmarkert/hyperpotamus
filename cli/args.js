var package = require("../package.json");

var args = require("yargs")
	.usage("Run a hyperpotamus script (http://github.com/pmarkert/hyperpotamus)\nUsage: $0")
	.example("$0 filename.yml", "Executes the script in filename.yml")
	.example("$0 get_ranking.yml --csv users.csv --qs 'username=admin&password=secret'", "Executes the get_ranking.yml script once for each record in the .csv file")
	.example("$0 script.yml --loop --concurrency=4", "Repeatedly executes script.yml in a loop, 4 at a time until Ctrl-C is pressed.")
	.alias("file", "f")
	.describe("file", "The YAML script to be executed")
	.requiresArg("file")
	.describe("qs", "Query-string encoded initial session state. HINT: enclose in '' to prevent special characters like & from being processed by the shell")
	.requiresArg("qs")
	.describe("csv", "Load session state data from a csv file (headers on the first line) and execute the script once for each record")
	.requiresArg("csv")
	.count("verbose")
	.alias("verbose", "v")
	.describe("verbose", "Verbose output; more flags for more output (up to 3) for INFO, DEBUG, and TRACE logging respectively i.e. -vvv")
	.describe("output", "Output file for emitted content. See documentation on the print/emit action.")
	.requiresArg("output")
	.alias("output", "o")
	.alias("output", "out")
	.describe("concurrency", "Maxiumum number of parallel script executions for script execution. Only effective if using --csv or --repeat.")
	.requiresArg("concurrency")
	.alias("concurrency", "c")
	.default("concurrency", 1)
	.alias("plugin", "plugins")
	.describe("plugins", "Directory path containing custom plugin(s) to be loaded.")
	.requiresArg("plugins")
	.describe("normalize", "Display the normalized version of the input script and then immediately exit (does not execute script)")
	.boolean("normalize")
	.describe("data", "YAML/JSON file containing initial session data")
	.requiresArg("data")
	.describe("safe", "Do not allow unsafe YAML types or plugins (not valid with --csv)")
	.describe("loop", "Specify the number of times to repeat the script as an argument, or repeat indefinitely.")
	.describe("init", "pre-run script starting at the named step before the main processing.")
	.describe("start", "The name of the first step to be executed during main processing.")
	.config()
	.describe("calfinated", "Uses the calfinated engine for macro interpolation instead of markup.js")
	.alias("calfinated", "!")
	.boolean("calfinated")
	.describe("help", "Displays documentation about a specified topic.")
	.requiresArg("start")
	.conflicts("loop", "csv")
	.check(function (args) {
		if(args.help) {
			return true;
		}
		if (!args.file && !args._.length >= 1) {
			throw new Error("Must specify the file to process either with -f, --file, or as the first positional argument.");
		}
		else if ((args.file && args._.length > 0) || args._.length > 1) {
			throw new Error("Unexpected positional arguments.");
		}
		return true;
	})
	.version(package.version)
	.strict();

module.exports = function (defaultConfigFile) {
	if (defaultConfigFile) {
		args.default("config", defaultConfigFile);
	}
	var argv = args.argv;
	if (!argv.file) {
		argv.file = argv._[0];
	}
	return argv;
};
