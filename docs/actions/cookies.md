# `cookies` action
Allows cookie values to be explicitly set before making requests. The value of the cookies property can either be the properties for a single cookie or an array of cookies.

Hyperpotamus automatically handles and manage cookies when communicating with a server. The `cookies` action gives the script developer an opportunity to explicitly pre-set, modify, or remove cookies above and beyond the automatic handling.

### `.key` property _(required)_
The key/name of the cookie.

### `.value` property _(required)_
The string value of the cookie.

### `.domain` property
The domain to which the cookie should be restricted. If omitted, `'*'` is used, which means that the cookie will be sent to any domain. Domain values should not include a leading `"."`.

NOTE: The handling of `'*'` as a universal domain value is a non-standard extension to the cookie specification by hyperpotamus. While this behavior would be a really bad idea for a normal user-agent to apply, in this scenario, it makes the scripting easier and less burdensome for script developers. Since the cookies in the context of a `cookies` action are being explicitly set by the script developer, the potential for problems is limited.

In contrast, the automatic cookie handling performed by hyperpotamus does properly reject any invalid cookies received from a server that might attempt to use a "*" value for the domain.

### `.path` property
The path to which the cookie should be restricted. IF omitted, `'/'` is used, which means that the cookie will be sent to any path. Path values should not include a trailing slash, unless it is the value `'/'`.

### `.secure` property
If truthy, then the cookie will only be sent over secure (https) connections.

### `.httpOnly` property
If truty, sets the httpOnly flag, which is of limited value in a non-browser environment.

### `.expires` property
An absolute date at which the cookie should expire in RFC6265 format.

### `.maxAge` property
The number of seconds after which the cookie should expire.

### `.extensions` property
An array of string extension values to be added to the cookie.

## Examples
```YAML
cookies: # a single, universal cookie
  key: user_id
  value: <% user_id %>
```

```YAML
cookies: # array of cookie values
  -
    key: cookie1
    value: value1
    domain: hyperpotamus.io
    path: "/special"
  -
    key: cookie2 # sent to any domain for https only
    secure: true
    value: "not so secret"
    # domain: "*" is inferred if not specified.
```

## Errors
### InvalidCookie
The cookie did not pass a validity check, most likely due to special characters or an improperly formatted domain. See RFC6265 for specific restrictions and formats.
