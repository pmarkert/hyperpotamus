# `push` action

Pushes an element onto the end of an array or concatenates one array onto the end of another.

```YAML
  - push:
      array: "array_path" || [ <%! array_reference %> ]
      value: value  || [ array_to_append ]
```

### `.array` property _(required)_

Can be either:
* (string) a key/path to the session variable for the target array
* (array) the actual array to be modified (via an <%! array_reference %>).

`.target` is an alias for `.array`

### `.value` property _(required)_
Can be either:
* (array) an array of values to be concatenated to the end of the target array
* (other) the value to be appended to the target array.


## Notes
When a key/path is used for `.array` and the target property does not already exist, a new empty array will be initialized. If the target does exist, then it must be an array.

If you want to create a multi-dimensional array by appending an array as the last element in the list (instead of concatenating the arrays together), then wrap the array within an additional array.

```YAML
- set:
    target_array: [ a, b, c ]
- push:
    array: target_array
    value: [ [ 1, 2, 3 ] ]
- print: <% target_array | json %> # [ a,b,c, [ 1,2,3 ] ]
```

## Errors
### ActionStructureError.push
A value cannot be provided for both `.array` and `.target`, because `.target` is an alias for `.array`.

### InvalidActionTarget.push
The value of `.array` was either not specified or referred to a non-array value.

### InvalidActionValue.push
The value of `.value` was not specified.
