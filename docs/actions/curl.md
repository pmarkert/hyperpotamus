# `curl` action
Generates the equivalent curl command-line for the HTTP request. If the value of the `curl` action is a string (key), the resulting command-line  will be stored in the session under the specified key. Any other value of the `curl` action will cause the command-line equivalent to be logged as an INFO level message.

## Syntax
To save the value into the session:
```YAML
curl: "curl_equivalent" # Stores in the session as "curl_equivalent"
```
To log the value to the default output stream.
```YAML
curl: true
```

## Errors
### InvalidActionPlacement.curl
No current HTTP response could be found in the session context. The `curl` action is only valid when nested inside of the `.response` property of a `request` action.

## Examples
```YAML
request: http://github.com
response:
  curl: true
```
