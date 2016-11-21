var package = require("./package.json");
var semver = require("semver");

module.exports = require("yargs")
	.usage("Run a hyperpotamus script (http://github.com/pmarkert/hyperpotamus)\nUsage: $0")
	.example("$0 filename.yml", "Executes the script in filename.yml")
	.example("$0 -f filename.yml -e 'Name was <%first%>'", "Executes filename.yml script, and prints the results of the interpolated string")
	.example("$0 get_ranking.yml --csv users.csv --qs 'username=admin&password=secret'", "Executes the get_ranking.yml script once for each record in the .csv file")
	.example("$0 script.yml --loop --concurrency=4", "Repeatedly executes script.yml in a loop, 4 at a time until Ctrl-C is pressed.")
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
	.describe("plugins", "Directory, file, or module-name to load custom plugin(s). Without any argument auto-loads plugins from script.")
	.describe("normalize", "Display the normalized version of the input script and then immediately exit (does not execute script)")
	.boolean("normalize")
	.describe("data", "YAML/JSON file containing initial session data")
	.requiresArg("data")
	.describe("safe", "Do not allow unsafe YAML types or plugins (not valid with --csv)")
	.describe("loop", "Specify the number of times to repeat the script as an argument, or repeat indefinitely.")
	.describe("requires", "A semver specification against which to check the current hyperpotamus version. Allows for compatibility/minimum version check to run the script.")
	.requiresArg("requires")
	.describe("init", "pre-run script starting at the named step before the main processing.")
	.describe("start", "The name of the first step to be executed during main processing.")
	.requiresArg("start")
	.check(function (args, options) {
		if (args.requires && !semver.satisfies(package.version, args.requires)) {
			throw new Error("This version of hyperpotamus does not satisfy the required version. Required version=" + args.requires + ", Current version=" + package.version);
		}
		if (!args.file && !args._.length >= 1) {
			throw new Error("Must specify the file to process either with -f, --file, or as the first positional argument.");
		}
		else if ((args.file && args._.length > 0) || args._.length > 1) {
			throw new Error("Unexpected positional arguments.");
		}
		if (args.csv && args.loop) {
			throw new Error("--loop and --csv are not currently both supported at the same time.");
		}
		return true;
	})
	.version(package.version)
	.strict()
	.argv;
