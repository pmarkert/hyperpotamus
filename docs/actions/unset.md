# `unset` action

Deletes the specified value(s) from the session.

```YAML
 - unset: key | [ key ]
```

The value of `unset` can either be a single key/path or an array of paths to be cleared (removed) from the context session.

## Examples
```YAML
- unset: access_token
```

```YAML
- unset: [ "username", "password" ]
```
