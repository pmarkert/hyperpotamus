# `text` action
Validates that the target string (or the HTTP response) contains the specified string.

## Syntax
```YAML
text: "text to find"
```

The value of `text` should be a string to be matched.

## Properties
### `.target` property
If the `.target`. property is specified, then it will be used for matching against instead of the HTTP response.

## Notes
### Case sensitivity
The `text` action is case-sensitive. If you wish to perform a case insensitive match, consider using the `regex` action with the 'i' option.

## Errors
### InvalidActionValue.text
The value of `text` should be a string to be matched.
```YAML
# Raises an InvalidActionValue.text error
text: 3
```

### InvalidActionPlacement.text
If the `.target` property is not specified, then the `text` action must be nested within the `.response` section of a `request` action.

### TargetIsNull
The value to be matched against (either from `.target` or the HTTP response) is null.

## Examples
```YAML
request:
  http://github.com/pmarkert/hyperpotamus
response:
  text: "Hyperpotamus"
```
