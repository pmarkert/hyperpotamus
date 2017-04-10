# `request_defaults` action
Allows default request headers and options to be explicitly set. Available headers and options are any values that can be specified in a `request` action, however, any values specified on a `request` will override these defaults.

`request_defaults` can be used to setup default values for all requests, or more specifically only set defaults restricted to a particular domain and/or path. Internally the `request_defaults` action uses a cookie-store to maintain the values, so any filtering rules that apply to cookies can also be used for defaults.

### Examples
Set defaults for all requests

```YAML
request_defaults:
  # Default request options such as headers, auth, proxy, method, etc.
```

or only requests to a particular domain and path

```YAML
request_defaults:
  domain: hyperpotamus.io
  path: /special
  request:
     # Default request options
```

setting multiple defaults configurations

```YAML
request_defaults:
  - request: 
      # Default request properties for all requests

  - domain: hyperpotamus.io
    path: /api
    request: 
      # Default request properties for all requests to http(s)://hyperpotamus.io/api

  - domain: hyperpotamus.io # domain to restrict
    secure: true
    request:
      # Defaults request properties for all requests to https://hyperpotamus.io 
```

### `.value` property _(required)_
The options to be set for matching requests. These properties will be merged into the options used by the `request` action.

`.request` is an alias for `.value`

### `.domain` property
The domain to which the defaults should be restricted. If omitted, `'*'` is used, which means that the defaults will be used for any domain. Domain values should not include a leading `"."`.

### `.path` property
The path to which the defaults should be restricted. If omitted, `'/'` is used, which means that the defaults will be used for any path. Path values should not include a trailing slash, unless it is the value `'/'`.

### `.secure` property
If truthy, then the defaults will only be used with secure (https) connections.

### `.expires` property
An absolute date at which the defaults should expire in RFC6265 format.

### `.maxAge` property
The number of seconds after which the defaults should expire.

## Errors
### ActionStructureError.request_defaults
Either the value of `request_defaults` was not an object or array of objects, or one of the objects contained both a `.request` and `.value` property.
