# `status` action
Either validates the HTTP status code of a response or alternatively saves the status code into a session variable.

If the value of `status` is an integer or an array (of integers), then the current status code will be compared to see if it matches any one of the values. If the value of `status` is a string, then the current status code will be saved into the session at the specified key/path.

## Syntax
For validation:
```YAML
status: status_code # or [ status_codes... ]
```
For capture:
```YAML
status: "session key/path"
```

## Errors
### StatusCodeMismatch
The value of the current HTTP status did not match any of the expected values.

### InvalidActionPlacement.status
No current HTTP response could be found in the session context. The `status` action is only valid when nested inside of the `.response` property of a `request` action.

### InvalidActionValue.status
The value of `status` must be an integer, array (of integers), or a string.
```YAML
# Raises InvalidActionValue.status error
status: true
```

## Examples
```YAML
request: http://github.com
response:
  status: 200
```
