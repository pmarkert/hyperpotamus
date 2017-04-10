# `exists` action

Checks to see if a value has been set in the session at the specified path/key.

```YAML
exists: "key"
```

`is_set` is an alias for `exists`.

## Example
```YAML
if:
  not:
    is_set: "authentication_token"
then:
   # request authentication
```

Raises an error if the path/key does not exist within the session.

## Notes
This is usually combined with an `if` action, potentially nested/wrapped within a `not` action.

## Errors
### InvalidActionValue.exists
The value of the `exists` action must be a string key/path.

### ValueNotSet
No value exists in the session at the specified key/path.
