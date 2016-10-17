module.exports.safe = true;

/*
 Purpose:
 Stores the body of the current HTTP response under the specified key

 Example:
 body: key
 */

module.exports.process = function (context) {
	context.session[this.body] = context.body;
}
