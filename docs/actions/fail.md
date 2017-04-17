# `fail` action

Causes the script to fail with a specified error message.

```YAML
fail: "Error message"
```
or
```YAML
false # => { fail: "Explicit false" }
```

The value of the `fail` is the error message to be displayed to the user.

## Notes
The fail action is useful to convey a specific error message to users when a certain condition is met. For example, in an `.on_failure` or nested under an `if/then` action.

## Examples
```YAML
- request:
    url: "some url"
    auth:
      bearer: <% access_token %>
    method: POST
  response:
    - if:
        status: 401
      then:
        fail: "Your access token has expired"
```

## Errors
### FailActionError
This is the error that will be raised as a result of the fail action.
