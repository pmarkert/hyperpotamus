# `regex` action
Validates or captures content from the body of an HTTP response or a specified target string.  If the regex pattern does not include any named capture groups, then the pattern will be executed against the string or response and will either succeed or fail (if no match could be found). If named capture groups `(:<name> )` are included then the captured groups will be added to the session context using the group names as the keys.

A literal javascript regex element will be normalized into a `regex` action.
```YAML
!!js/regexp /pattern/
```
using a string-based regex template
```YAML
regex: "/pattern/opt" # => { regex: { pattern: "pattern", options: "opt" } }
```
Applied to a specific target string
```YAML
regex:
  pattern: "pattern"
  options: "" # gim
target: <% some_key %>
```

### `regex.pattern` property _(required)_
The pattern property is the regex pattern to be applied.

### `regex.options` property
The regex options ("gim") to be applied.

### `target` property
The target property can be used to provide a specific string to apply the regex against. If not specified, then the current HTTP response will be used.

## Errors
### "InvalidActionPlacement.regex"
The regex action must either be placed within the `.response` section of a `request` action, or an explicit target must be specified.

### "TargetIsNull"
Either the value provided for `target` or the HTTP response body is null.
