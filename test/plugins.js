var path = require("path");
describe("actions/", function() {
	require("../util/auto_include")(path.join(path.dirname(__filename), "actions"));
});
