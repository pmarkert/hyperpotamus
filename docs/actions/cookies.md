# `cookies` action
Allows cookie values to be explicitly set before making requests. Cookies must have both key and value properties. The cookie may also include domain, path, secure, and expires restrictions. The value of the cookies property can either be the properties for a single cookie or an array of cookie values.

## Examples
```YAML
cookies: # Single cookie
  key: user_id
  value: <% user_id %>
```

```YAML
cookies: # Array of cookie values
  - key: cookie1
    value: value1
    domain: hyperpotamus.io
    path: "/special"
  - key: cookie2 # sent to any domain for https only
    secure: true
    value: "not so secret"
    # domain: "*" is inferred if not specified.
```

## Errors
### InvalidCookie
The cookie did not pass a validity check, most likely due to special characters or an improperly formatted domain.
