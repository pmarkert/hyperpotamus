# `foreach` action

Executes the specified `.actions` for each element `.in` the specified array(s), placing the current array element into the corresponding `.key`s. The processing can be customized to happen in serial (the default) or in parallel w/a specified concurrency limit.

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
A single value or an array of values for the path/keys (string) in which to store the current values of the corresponding arrays specified by the `.in` property.

### `.in` property _(required)_
A single array or an array of arrays for which to enumerate and populate the `.key` values. Each value can either be an array reference or a key/path to an array.

### `.actions` property _(required)_
The actions to be processed for each iteration while assigning the current array values from the `.in` property to the proper variables in the `.key` property.

### `.parallel` property
If the value is an integer, it is treated as the maximum degree of parallelism for processing the `.actions`. A value of `true` represents unbounded parallelism (value = Infinity) and a value of `false` represents no parallelism (value = 1).

### `.shared` property
A single key/path or an array of keys/paths to session objects which should not be cloned but rather separated between forked instances.

## Examples
```YAML
- set:
    fruits: [ apples, bananas, cherries ]
- foreach:
    key: fruit
    in: fruits
    parallel: true
    actions:
      - print: <% fruit %>
```

