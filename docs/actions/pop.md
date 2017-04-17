# `pop` action

Pops an element from the end of an array into the specified session location.

```YAML
  - pop:
      array: "array_path" || <% array_reference %>
      key: "key/path" 
```

### `.array` property _(required)_

Can be either:
* (string) a key/path to the session variable for the target array
* (array) the literal array to be modified (either inline or via an <% array_reference %>).

### `.key` property _(required)_
The key/path for where to store the popped value.

### Example
```YAML
- set:
    stuff: [ foo, bar, baz ]
- pop:
    array: stuff
    key: popped
- print: The popped one was '<% popped %>', but the rest is '<% stuff | join %>'
# The popped one was 'baz', but the rest is 'foo,bar'
```

## Errors
### InvalidActionValue.pop
Either the value of `.array` or `.value` were not specified or the value of `.array` was did not refer to an array.
