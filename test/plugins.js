var path = require("path");
describe("plugins/", function() {
	require("../util/auto_include")(path.join(path.dirname(__filename), "plugins"));
});
