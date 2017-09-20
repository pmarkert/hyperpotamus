# `foreach` action

Executes the specified `.actions` for each element `.in` one or more specified arrays, placing the current values into the corresponding `.key` variables. Processing can be customized to happen in serial (the default) or in `.parallel` w/an optionally specified concurrency limit.

```YAML
 - foreach:
    key: key | [ key1, ... keyN ]
    in: array | [ array1, ... arrayN ]
    parallel: false | true | concurrency_level # where concurrency_level is an integer
    actions:
      - {action}
      ...
      - {action}
```

### `.key` property _(required)_
A single value or an array of values for the path/keys in which to store the current values of the corresponding arrays specified by the `.in` property.

### `.in` property _(required)_
A single array or an array of arrays for which to enumerate and populate the corresponding `.key` values. Each value can either be a literal array, an array reference or the key/path to an array.

### `.actions` property _(required)_
The actions to be processed for each iteration while assigning the current array values from the `.in` property to the proper variables in the `.key` property.

### `.parallel` property
If the value is an integer, it is treated as the maximum degree of parallelism for processing the `.actions`. A value of `true` represents unbounded parallelism (=Infinity) and a value of `false` (the default) represents no parallelism.

### `.shared` property
A single key/path or an array of keys/paths to session objects which should not be cloned but rather shared between forked instances.

## Examples
```YAML
- set:
    fruits: [ apples, bananas, cherries ]
    meats: [ albacore, beef, chicken ]

# Iterating a single array
- foreach:
    key: fruit
    in: fruits
    parallel: true
    actions:
      - print: Vegetarians eat <% fruit %>

# Iterating 2 arrays at once
 - foreach:
     key: [ fruit, meat ]
     in: [ fruits, meats ]
     actions:
       print: Vegetarians might eat <% fruit %>, but never <% meat %>.
```

## Notes
#### Ambiguity with a single inline array
While it is possible to use a single inline array, the `foreach` plugin cannot easily determine if you are attempting to represent a single array of string values or an array of keys to lookup multiple arrays in the session. To resolve this ambiguity, make it a multi-dimensional array by nesting the inline arrays inside a wrapper array.
```YAML
foreach:
  key: fruit
  in: [ [ apples, bananas, cherries ] ]
  actions:
    print: <% fruit %>
```
Otherwise, without the double-wrapper you will get a missing key error trying to find the "apples" array in the session.

#### Parallel processing
Node.js uses an inherently single threaded processing model, however, asynchronous actions such as i/o can be processed in parallel to speed up the execution time. Using the `parallel: true` option on a `foreach` action will cause each iteration to be launched in parallel.

When `parallel` procesing is utilized, the order of processing results is not guaranteed.

#### Session context isolation
Each iteration of a foreach loop is provided with an independent copy/clone of the session context. This is important to prevent actions from one iteration from inadvertently affecting the state in use by other iterations. This isolation is even more critical when processing actions in parallel.

Because each iteration receives it's own copy of the session context, this increases the memory requirements of the application. Be careful when using parallelism with very large arrays, especially if the session state is large.

#### Shared properties
Because each iteration receives it's own snapshot of the session context when the iteration begins, iterations are not able to easily share data/communicate with each other or to modify the parent session state once completed. Shared properties are a mechanism by which specific values in the session can be mapped by reference and all contexts share the same value. With shared properties, modifications made to the object in one iteration will affect the value seen by other iterations as well as the parent session context when processing of the `foreach` is completed. This can be used to collect results and push them onto a results array for example.

```YAML
- set:
    fruits: [ apples, bananas, cherries ]
    results: []
- foreach:
     key: fruit
     in: fruits
     shared: results
     actions:
       - push:
           array: results
           value: ANGRY VEGANS EAT <% fruit | upcase %>!

- print: <% results | join %> # "ANGRY VEGANS EAT APPLES!,ANGRY VEGANS EAT BANANAS!,ANGRY VEGANS EAT CHERRIES!"
```

The shared state property can either be an object, a string session key or an array of session key strings. If the `shared` property is a key or array of keys, the corresponding session values will be assigned from the parent session context into the child session context using the same keys. If the value of `shared` is an object that object will be assigned to the child-session directly


