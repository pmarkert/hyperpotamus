var _ = require("lodash");
var marked = require('marked');
var TerminalRenderer = require('marked-terminal');
var fs = require("fs");
var path = require("path");
var docs_folder = path.join(__dirname, "..", "docs");

marked.setOptions({
	// Define custom renderer 
	renderer: new TerminalRenderer({
		reflowText: true,
		width: process.stdout.columns - 10
	})
});

module.exports = function help(args) {
	if (args.help === true) {
		args.help = "";
	}
	var content = readContent(args.help);
	if (content == null) {
		content = readContent(args.help + "/readme");
		if(content==null) {
			content = marked("This topic does not have any content.");
		}
		content += formatSubTopics(args.help);
	}
	if (content == null) {
		content = readContent("readme");
	}
	console.log(marked(content));
};

function readContent(filename) {
	var doc_file = path.join(docs_folder, filename + ".md");
	if (!fs.existsSync(doc_file)) {
		return null;
	}
	return fs.readFileSync(doc_file, "utf-8");
}

function getSubTopics(pathToSearch) {
	var files = fs.readdirSync(path.join(docs_folder, pathToSearch));
	return files
		.filter(f => f.toLowerCase() !== "readme.md")
		.filter(f => !f.startsWith("."))
		.filter(f => _.includes([ "", ".md" ], path.extname(f)))
		.map(f => path.basename(f, ".md"));
}

function formatSubTopics(topic) {
	var display_topic = topic;
	if(display_topic!="") {
		display_topic += "/";
	}
	var topics = getSubTopics(topic);
	var result = "## Subtopics\n";
	result += "run `hyperpotamus --help {subtopic}` to view help on the following subtopics.\n";
	topics.forEach(t => {
		result += "* " + display_topic + t + "\n";
	});
	return result;
}
