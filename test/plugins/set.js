var _set = require("../../lib/plugins/set");
var _ = require("lodash");
var assert = require("assert");
var mock_context = require("../mock_context");
var validateVError = require("../lib/validate_verror");

describe("set.js", () => {
	describe("normalize()", () => {
		describe("should succesfully normalize", () => {
			function test(to_normalize, expected_output) {
				var result = _set.normalize(to_normalize);
				assert(result != null, "Should have returned a normalized object");
				assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
				assert.deepEqual(result, expected_output, "Normalization output did not match");
			}

			describe("defaults", () => {
				it("shortcut", () => test({ defaults: { key: "value" } }, { set: { mode: "defaults", source: { key: "value" } } }));
				it("shortcut, empty object", () => test({ defaults: {} }, { set: { mode: "defaults", source: {} } }));
				it("explicit source", () => test({ defaults: { source: { key: "value" } } }, { set: { mode: "defaults", source: { key: "value" } } }));
				it("explicit source and string target", () => test({ defaults: { source: { key: "value" }, target: "target_key" } }, { set: { mode: "defaults", source: { key: "value" }, target: "target_key" } }));
				it("explicit source and object target", () => test({ defaults: { source: { key: "value" }, target: { object: true } } }, { set: { mode: "defaults", source: { key: "value" }, target: { object: true } } }));
				it("explicit source and object target with extra fields", () => test({ defaults: { source: { key: "value" }, target: { object: true }, preserved: true } }, { set: { mode: "defaults", source: { key: "value" }, target: { object: true }, preserved: true } }));
				it("explicit source and object target, overwrite=false", () => test({ defaults: { mode: "defaults", source: { key: "value" }, target: { object: true }, preserved: true } }, { set: { mode: "defaults", source: { key: "value" }, target: { object: true }, preserved: true } }));
				it("explicit source and object target, overwrite=true", () => test({ defaults: { mode: "set", source: { key: "value" }, target: { object: true }, preserved: true } }, { set: { mode: "defaults", source: { key: "value" }, target: { object: true }, preserved: true } }));
				it("shortcut preserves top-level properties", () => test({ debugger: true, defaults: { key: "value" } }, { debugger: true, set: { mode: "defaults", source: { key: "value" } } }));
				it("explicit preserves top-level properties", () => test({ debugger: true, defaults: { source: { key: "value" } } }, { debugger: true, set: { mode: "defaults", source: { key: "value" } } }));
			});

			describe("set", () => {
				it("shortcut", () => test({ set: { key: "value" } }, { set: { mode: "set", source: { key: "value" } } }));
				it("shortcut, empty object", () => test({ set: {} }, { set: { mode: "set", source: {} } }));
				it("explicit source", () => test({ set: { source: { key: "value" } } }, { set: { mode: "set", source: { key: "value" } } }));
				it("explicit source and string target", () => test({ set: { source: { key: "value" }, target: "target_key" } }, { set: { mode: "set", source: { key: "value" }, target: "target_key" } }));
				it("explicit source and object target", () => test({ set: { source: { key: "value" }, target: { object: true } } }, { set: { mode: "set", source: { key: "value" }, target: { object: true } } }));
				it("explicit source and object target with extra fields", () => test({ set: { source: { key: "value" }, target: { object: true }, preserved: true } }, { set: { mode: "set", source: { key: "value" }, target: { object: true }, preserved: true } }));
				it("explicit source and object target, overwrite=false", () => test({ set: { mode: "defaults", source: { key: "value" }, target: { object: true }, preserved: true } }, { set: { mode: "set", source: { key: "value" }, target: { object: true }, preserved: true } }));
				it("explicit source and object target, overwrite=true", () => test({ set: { mode: "set", source: { key: "value" }, target: { object: true }, preserved: true } }, { set: { mode: "set", source: { key: "value" }, target: { object: true }, preserved: true } }));
				it("shortcut preserves top-level properties", () => test({ debugger: true, set: { key: "value" } }, { debugger: true, set: { mode: "set", source: { key: "value" } } }));
				it("explicit preserves top-level properties", () => test({ debugger: true, set: { source: { key: "value" } } }, { debugger: true, set: { mode: "set", source: { key: "value" } } }));
			});

			describe("merge", () => {
				it("shortcut", () => test({ merge: { key: "value" } }, { set: { mode: "merge", source: { key: "value" } } }));
				it("shortcut, empty object", () => test({ merge: {} }, { set: { mode: "merge", source: {} } }));
				it("explicit source", () => test({ merge: { source: { key: "value" } } }, { set: { mode: "merge", source: { key: "value" } } }));
				it("explicit source and string target", () => test({ merge: { source: { key: "value" }, target: "target_key" } }, { set: { mode: "merge", source: { key: "value" }, target: "target_key" } }));
				it("explicit source and object target", () => test({ merge: { source: { key: "value" }, target: { object: true } } }, { set: { mode: "merge", source: { key: "value" }, target: { object: true } } }));
				it("explicit source and object target with extra fields", () => test({ merge: { source: { key: "value" }, target: { object: true }, preserved: true } }, { set: { mode: "merge", source: { key: "value" }, target: { object: true }, preserved: true } }));
				it("explicit source and object target, overwrite=false", () => test({ merge: { mode: "merge", source: { key: "value" }, target: { object: true }, preserved: true } }, { set: { mode: "merge", source: { key: "value" }, target: { object: true }, preserved: true } }));
				it("explicit source and object target, overwrite=true", () => test({ merge: { mode: "set", source: { key: "value" }, target: { object: true }, preserved: true } }, { set: { mode: "merge", source: { key: "value" }, target: { object: true }, preserved: true } }));
				it("shortcut preserves top-level properties", () => test({ debugger: true, merge: { key: "value" } }, { debugger: true, set: { mode: "merge", source: { key: "value" } } }));
				it("explicit preserves top-level properties", () => test({ debugger: true, merge: { source: { key: "value" } } }, { debugger: true, set: { mode: "merge", source: { key: "value" } } }));
			});

		});

		describe("should not normalize", () => {
			function test(to_normalize) {
				assert(_set.normalize(to_normalize) == null);
			}

			it("null", () => test(null));
			it("integer", () => test(3));
			it("string", () => test("String"));
			it("true", () => test(true));
			it("Date", () => test(new Date()));
			it("an object without .defaults, .set, or .merge", () => test({ object: true }));
		});

		describe("should throw an error for invalid actions", () => {
			function test(to_normalize) {
				assert.throws(() => _set.normalize(to_normalize), validateVError("ActionStructureError.set"));
			}

			it(".defaults is true", () => test({ defaults: true }));
			it(".defaults is false", () => test({ defaults: false }));
			it(".defaults is a number", () => test({ defaults: 3 }));
			it(".defaults is null", () => test({ defaults: null }));
			it(".defaults is an array", () => test({ defaults: [] }));
			it(".defaults is a date", () => test({ defaults: new Date() }));
			it(".set is true", () => test({ set: true }));
			it(".set is false", () => test({ set: false }));
			it(".set is a number", () => test({ set: 3 }));
			it(".set is null", () => test({ set: null }));
			it(".set is an array", () => test({ set: [] }));
			it(".set is a date", () => test({ set: new Date() }));
			it(".merge is true", () => test({ merge: true }));
			it(".merge is false", () => test({ merge: false }));
			it(".merge is a number", () => test({ merge: 3 }));
			it(".merge is null", () => test({ merge: null }));
			it(".merge is an array", () => test({ merge: [] }));
			it(".merge is a date", () => test({ merge: new Date() }));
		});
	});

	describe("process()", () => {
		function test(mode, target, source, expected_session, initial_session) {
			var action = { set: { mode, target, source } };
			var context = mock_context.instance(_.clone(initial_session) || {});
			var result = _set.process.call(action, context);
			assert(result == undefined);
			assert.deepEqual(context.session, expected_session, "Session did not match expectation.");
		}

		describe("mode=set", () => {
			describe("target=null", () => {
				it("new property", () => test("set", null, { key: "value" }, { key: "value", existing: "session" }, { existing: "session" }));
				it("existing property", () => test("set", null, { existing: "new_value" }, { existing: "new_value" }, { existing: "session" }));
				it("nested property", () => test("set", null, { existing: { child: "new_value" } }, { existing: { child: "new_value" } }, { existing: "session" }));
				it("dotted property", () => test("set", null, { "existing.child": "new_value" }, { "existing": "session", "existing.child": "new_value" }, { existing: "session" }));
			});

			describe("target=string_key", () => {
				it("new property", () => test("set", "target", { key: "value" }, { target: { key: "value" }, existing: "session" }, { existing: "session" }));
				it("existing property", () => test("set", "target", { key: "value" }, { target: { key: "value" } }, { target: "session" }));
				it("new nested property", () => test("set", "child.target", { key: "value" }, { child: { target: { key: "value" } }, existing: "session" }, { existing: "session" }));
				it("existing nested property", () => test("set", "child.target", { key: "value" }, { child: { target: { key: "value" } } }, { child: "session" }));
				it("existing nested property with sibling values", () => test("set", "child.target", { key: "value" }, { child: { target: { key: "value" }, existing: "session" } }, { child: { existing: "session" } }));
				it("existing nested property with existing child values", () => test("set", "child.target", { key: "value" }, { child: { target: { key: "value" } } }, { child: { target: { existing: "session" } } }));
			});
		});

		describe("mode=defaults", () => {
			describe("target=null", () => {
				it("new property", () => test("defaults", null, { key: "value" }, { key: "value", existing: "session" }, { existing: "session" }));
				it("existing property", () => test("defaults", null, { existing: "new_value" }, { existing: "session" }, { existing: "session" }));
				it("nested property", () => test("defaults", null, { existing: { child: "new_value" } }, { existing: "session" }, { existing: "session" }));
				it("dotted property", () => test("defaults", null, { "existing.child": "new_value" }, { "existing": "session", "existing.child": "new_value" }, { existing: "session" }));
			});

			describe("target=string_key", () => {
				it("new property", () => test("defaults", "target", { key: "value" }, { target: { key: "value" }, existing: "session" }, { existing: "session" }));
				it("existing property", () => test("defaults", "target", { key: "value" }, { target: "session" }, { target: "session" }));
				it("new nested property", () => test("defaults", "child.target", { key: "value" }, { child: { target: { key: "value" } }, existing: "session" }, { existing: "session" }));
				it("existing nested property", () => test("defaults", "child.target", { key: "value" }, { child: { target: { key: "value" } } }, { child: "session" }));
				it("existing nested property with sibling values", () => test("defaults", "child.target", { key: "value" }, { child: { target: { key: "value" }, existing: "session" } }, { child: { existing: "session" } }));
				it("existing nested property with existing child values", () => test("defaults", "child.target", { key: "value" }, { child: { target: { key: "value", existing: "session" } } }, { child: { target: { existing: "session" } } }));
			});
		});
		
		describe("mode=merge", () => {
			describe("target=null", () => {
				it("new property", () => test("merge", null, { key: "value" }, { key: "value", existing: "session" }, { existing: "session" }));
				it("existing property", () => test("merge", null, { existing: "new_value" }, { existing: "new_value" }, { existing: "session" }));
				it("nested property", () => test("merge", null, { existing: { child: "new_value" } }, { existing: { child: "new_value" } }, { existing: "session" }));
				it("dotted property", () => test("merge", null, { "existing.child": "new_value" }, { "existing": "session", "existing.child": "new_value" }, { existing: "session" }));
			});

			describe("target=string_key", () => {
				it("new property", () => test("merge", "target", { key: "value" }, { target: { key: "value" }, existing: "session" }, { existing: "session" }));
				it("existing property", () => test("merge", "target", { key: "value" }, { target: { key: "value" } }, { target: "session" }));
				it("new nested property", () => test("merge", "child.target", { key: "value" }, { child: { target: { key: "value" } }, existing: "session" }, { existing: "session" }));
				it("existing nested property", () => test("merge", "child.target", { key: "value" }, { child: { target: { key: "value" } } }, { child: "session" }));
				it("existing nested property with sibling values", () => test("merge", "child.target", { key: "value" }, { child: { target: { key: "value" }, existing: "session" } }, { child: { existing: "session" } }));
				it("existing nested property with existing child values", () => test("merge", "child.target", { key: "value" }, { child: { target: { key: "value", existing: "session" } } }, { child: { target: { existing: "session" } } }));
			});
		});
	});
});
