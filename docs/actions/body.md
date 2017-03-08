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
