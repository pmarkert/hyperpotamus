module.exports.safe = true;
module.exports.manual_interpolation = ["actions"];

/*
 Purpose:
 Executes the specified actions for each value in the specified array(s), assigning the array value to the specified key(s). 
 If parallel=true, then the actions will be processed concurrently with each iteration receiving a separate snapshot of the session.

 Example:
- foreach:
    key: [ item, ad ]
    in: [ items, ads ]
    parallel: true
    actions:
      - goto: token_exchange
 
 */

var _ = require("lodash");
var verror = require("verror");
var Promise = require("bluebird");

module.exports.normalize = function (action, normalize_action) {
	if (_.has(action, "foreach")) {
		// Normalize nested actions
		action.foreach.key = _.castArray(action.foreach.key);
		action.foreach.in = _.castArray(action.foreach.in);
		action.foreach.actions = normalize_action(action.foreach.actions, "foreach.actions");
		return action;
	}
};

module.exports.process = function (context) {
	var foreachPath = this.path + ".foreach";
	var matrix = prepareMatrix(this.foreach.in, this.foreach.key, context, foreachPath);

	// Select serial or parallel mapper
	var mappingFunction = getMappingFunctionForConcurrency(this.foreach.parallel, foreachPath + ".parallel");
	return mappingFunction(matrix, tuple => {
		applySharedProperties(tuple, this.foreach.shared, context, foreachPath + ".shared");
		exports.logger.debug("Forking with " + JSON.stringify(tuple));
		var new_context = context.clone(tuple);
		return new_context.processAction(this.foreach.actions)
			.catch(context.ProcessingDirective, new_context.handleDirective);
	});
};

module.exports.tuplify = tuplify;
module.exports.transpose = transpose;
module.exports.interpolateAndValidate = interpolateAndValidate;
module.exports.prepareMatrix = prepareMatrix;
module.exports.getMappingFunctionForConcurrency = getMappingFunctionForConcurrency;
module.exports.applySharedProperties = applySharedProperties;

function applySharedProperties(tuple, shared, context, path) {
	if (_.isArray(shared)) {
		shared.forEach((item, index) => {
			if (!_.isString(item)) {
				throw new verror.VError({
					name: "InvalidSharedPropertiesValue",
					info: {
						path: `${path}.${index}`,
						value: item
					}
				}, "If .foreach.shared is an array, it must be an array of string property keys");
			}
		});
	}
	if (_.isString(shared) || _.isArray(shared)) {
		_.castArray(shared).forEach(item => {
			_.set(tuple, item, context.getSessionValue(item));
		});
	}
	else {
		_.assign(tuple, shared);
	}
}

function getMappingFunctionForConcurrency(parallel_option, path) {
	if (parallel_option === false || _.isNil(parallel_option)) {
		return Promise.mapSeries;
	}
	else if (parallel_option === true) {
		return _.partialRight(Promise.map, { concurrency: Infinity });
	}
	else {
		if (!_.isNumber(parallel_option)) {
			throw new verror.VError({
				name: "InvalidParallelOption",
				info: {
					path
				}
			}, "If specified, foreach.parallel must be either a boolean value or an integer.");
		}
		else {
			return _.partialRight(Promise.map, { concurrency: parallel_option });
		}
	}
}

function prepareMatrix(arrays, keys, context, path) {
	return tuplify(transpose(interpolateAndValidate(arrays, context, path)), keys);
}

function interpolateAndValidate(arrays, context, path) {
	// Each of the array targets, is either an array, or a reference to an array
	// So normalize and interpolate any key references, then validate
	return arrays.map((vector, index) => {
		if (_.isString(vector)) {
			vector = context.getSessionValue(vector, path + ".in");
		}
		if (!_.isArray(vector)) {
			throw new verror.VError({
				name: "InvalidForeachTarget",
				info: {
					path: `${path}.in[${index}]`
				}
			}, "foreach .in elements must be an array or reference to an array");
		}
		return vector;
	});
}

function transpose(matrix) {
	/* Transpose switches a multi-dimensional array AxB -> BxA.

	   [ 'a', 'b', 'c' ]         [ 'a', 1 ]
	   [  1 ,  2 ,  3  ]   =>    [ 'b', 2 ]
								 [ 'c', 3 ]
	*/
	return _.zip.apply(null, matrix);
}

function tuplify(matrix, keys) {
	return matrix.map(_.partial(_.zipObject, keys));
}
