var _ = require("lodash");
var _actions = require("../../lib/actions/actions");
var assert = require("assert");
var mock_context = require("../mock_context");
var normalizer = require("../mock_normalizer");
var validateVError = require("../test_utils/validate_verror");

describe("actions.js", () => {
	describe("normalize()", () => {
		describe("should succesfully normalize", () => {
			function test(to_normalize, length) {
				var result = _actions.normalize(to_normalize, normalizer);
				assert(_.isObject(result) && !_.isArray(result), "Should have returned an object not an array");
				assert(_.isArray(result.actions), "Should have had a .actions property that is an array");
				assert(result.actions.length == length, `Should have had ${length} nested actions`);
				assert(_.every(result.actions, (action) => action.normalized === true));
			}

			it("an array", () => test([{ name: "first", normalized: false }, { name: "second", normalized: false }], 2));
			it("an array of 1 element", () => test([{ name: "first", normalized: false }], 1));
			it("an array of 0 elements", () => test([], 0));
			it("an 'actions' action", () => test({ actions: [{ name: "first", normalized: false }, { name: "second", normalized: false }] }, 2));
		});

		describe("should not normalize", () => {
			function test(to_normalize) {
				assert(_actions.normalize(to_normalize, normalizer) == null);
			}

			it("null", () => test(null));
			it("integer", () => test(3));
			it("string", () => test("String"));
			it("true", () => test(true));
			it("false", () => test(false));
			it("Date", () => test(new Date()));
			it("an object without .actions", () => test({ object: true }));
		});

		describe("should throw an error for invalid actions", () => {
			function test(to_normalize) {
				assert.throws(() => _actions.normalize(to_normalize, normalizer), validateVError("ActionStructureError.and"));
			}

			it(".and is true", () => test({ and: true }));
			it(".and is a string", () => test({ and: "true" }));
			it(".and is null", () => test({ and: null }));
		});
	});

	describe("process()", function () {
		describe("should successfully process", () => {
			function test(to_process) {
				var context = mock_context.instance();
				return _actions.process.call(to_process, context).then(() => {
					assert.deepEqual(to_process.actions, context.processed_actions, "Processed actions should have matched");
				});
			}

			it("an empty array", () => test({ actions: [] }));
			it("an array of 1", () => test({ actions: [true] }));
			it("an array of actions", () => test({ actions: [true, true] }));
		});

		describe("should fail with", () => {
			function test(actions_value, processed_actions) {
				processed_actions = processed_actions || actions_value;
				var context = mock_context.instance();
				var to_process = { actions: actions_value };
				return _actions.process.call(to_process, context).then(() => {
					assert.fail("Should not have succeeded");
				}).catch(() => {
					assert.deepEqual(processed_actions, context.processed_actions, "Processed actions did not match");
				});
			}

			it("a single failing action", () => test([false]));
			it("a failing action after a successful one", () => test([true, false]));
			it("multiple failing actions", () => test([false, false], [false]));
			// TODO - this test does not really test the AND short-circuit, because it is the processor class that evaluates
			// arrays of objects for processing. Right now, we are essentially testing that our mock context short-circuits.
			it("short-circuit evaluation of nested actions", () => test([true, false, true], [true, false]));
		});
	});
});
