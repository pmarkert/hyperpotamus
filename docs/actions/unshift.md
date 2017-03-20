# `unshift` action

Pushes an element onto the start of an array or prepends one array to the start of another.

```YAML
  - unshift:
      array: "array_path" || [ <%! array_reference %> ]
      value: value  || [ array_to_prepend ]
```

### `.array` property _(required)_

Can be either:
* (string) a key/path to the session variable for the target array
* (array) the actual array to be modified (via an <%! array_reference %>).

`.target` is an alias for `.array`

### `.value` property _(required)_
Can be either:
* (array) an array of values to be prepended to the beginning of the target array
* (other) the value to be prepended to the start of the target array.


## Notes
When a key/path is used for `.array` and the target property does not already exist, a new empty array will be initialized. If the target does exist, then it must be an array.

If you want to create a multi-dimensional array by inserting an array as the first element in the list (instead of prepending the array onto the target), then wrap the array with an additional array.

```YAML
- set:
    target_array: [ a, b, c ]
- unshift:
    array: target_array
    value: [ [ 1, 2, 3 ] ]
- print: <% target_array | json %> # [ [ 1,2,3 ], a,b,c  ]
```

## Errors
### ActionStructureError.unshift
A value cannot be provided for both `.array` and `.target`, because `.target` is an alias for `.array`.

### InvalidActionTarget.unshift
The value of `.array` was either not specified or referred to a non-array value.

### InvalidActionValue.unshift
The value of `.value` was not specified.
