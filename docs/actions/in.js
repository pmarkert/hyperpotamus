# `in` action
Checks to see if an array contains the specified value

```YAML
in:
  value: value_to_search_for
  array: [ literal_array ] | "array_key"
```

### `.value` property _(required)_
The `.value` property specifies the value to be searched for in the array. The value can be of any type.

### `.array` property _(required)_
The `.array` property specifies the array in which to be search for the value. The array can either be included inline as a literal, via an <% object_reference %>, or if it is a string, will be used as the key/path to find the array in the session.

## Errors
### InvalidArrayValue
The `.array` property did not refer to a valid array. 

### ValueNotFoundInArray
The `.value` could not be found in the `.array`.
