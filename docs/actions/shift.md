# `shift` action
Shifts an element from the start of an array into the specified session location.

```YAML
  - shift:
      array: "array_path" || <% array_reference %>
      key: "key/path" 
```

### `.array` property _(required)_

Can be either:
* (string) a key/path to the session variable for the target array
* (array) the literal array to be modified (either inline or via an <% array_reference %>).

### `.key` property _(required)_
The key/path for where to store the shifted value.

### Example
```YAML
- set:
    stuff: [ foo, bar, baz ]
- shift:
    array: stuff
    key: shifted
- print: The shifted one was '<% shifted %>', but the rest is '<% stuff | join %>'
# The shifted one was 'foo', but the rest is 'bar,baz'
```

## Errors
### InvalidActionValue.shift
Either the value of `.array` or `.value` were not specified or the value of `.array` was did not refer to an array.
