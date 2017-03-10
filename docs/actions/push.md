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
When a key/path is used for `.array`, if the target property does not exist in the session, a new empty array will be initialized,
otherwise, if the value does exist, it must be an array.

If you want to create a multi-dimensional array by append an array to the end of the target (instead of concatenating), then wrap the array as a single-element array.

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
