# `body` action
Stores the body of the current HTTP response into the session under the specified key.

## Structure
```YAML
# Store the HTTP response into the session as "key".
body: key
```

The `body` action must be nested within the .response section of a `request` action.

## Examples
```YAML
# The key can be a simple property name
body: response_body
```

```YAML
# Or the key or a complex path under which to store the response:
body: responses.first
```

```YAML
# We can also use dynamic macros in the key name
body: "customer_data[<% customer_id %>].response"
```
## Errors
### InvalidActionPlacement.body
The `body` action is only valid for placement within the response section of a `request` action.

### InvalidActionValue.body
The value of the `body` action must be a string key/path under which to store the response.
```YAML
body: [ 1, 2, 3 ] # throw InvalidActionValue.body because the array [ 1, 2, 3 ] is not a string path.
```

### NullResponseBody
Even though the `body` action is properly nested inside of a response section, the HTTP response body value received from the server was null.
