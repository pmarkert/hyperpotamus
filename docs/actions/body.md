# `body` action
Stores the body of the current http response (from a [request](request) action) into the session under the specified key/path.

```YAML
body: "key"
```


The `body` action is only valid when nested within the `.response` section of a [request](request) action.

## Examples
```YAML
# The key can be a simple property name
# request: http://hyperpotamus.io
# response:
    body: response_body
```

```YAML
# The key can also be a path under which to store the response:
# request: ...
# response:
    body: "responses.first"
```

```YAML
# Using macros in the path to store in a dynamic location
# response:
    body: "customer_data[<% customer_id %>].response"
```

## Notes
The response that is "seen" by the body action is scoped based upon the nearest containing [request](request) action's `.response` property.

Upon entering the `.response` processing section for a [request](request) action, hyperpotamus makes a copy of any existing response value before storing the new value into the session. Upon completing the `.response` actions section, hyperpotamus restores (or unsets) the value back to the pre-existing state before continuing. This means that [request](request) actions nested underneath other [request](request) actions do not interfere with each other.

```YAML
request: <% first_url %> # request first page
response:
  - body: first_page # captures first response
  - request: <% second_url %> # request second page
    response:
      - body: second_page # captures second response
  - request: <% third_url %> # request third page
      - body: third_page # captures third response
  - body: back_to_first_page # scope reset back to first response
```

## Errors
### InvalidActionPlacement.body
The `body` action is only valid for placement within the `.response` section of a [request](request) action.

### InvalidActionValue.body
The value of the `body` action must be a string key/path under which to store the response body.
```YAML
body: [ 1, 2, 3 ] # throw InvalidActionValue.body because the array [ 1, 2, 3 ] is not a string path.
```

### NullResponseBody
Even though the `body` action is properly nested inside of a [request](request) action's `.response` section, the HTTP response body value received from the server was null.
