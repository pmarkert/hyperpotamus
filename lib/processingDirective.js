module.exports = ProcessingDirective;

function ProcessingDirective(directive) {
	Object.assign(this, directive);
}

ProcessingDirective.prototype = Object.create(Error.prototype);
