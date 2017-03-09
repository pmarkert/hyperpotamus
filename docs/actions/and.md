# `and` action
is an alias for the [actions](actions) action. The only additional restriction is that when the `and` alias is used, the array value must contain more than one action.

## Aliases
```YAML
# An "and" action
and:
  - {action1}
  ...
  - {actionN}
```  
will be written during normalization as:
```YAML
actions:
  - {action1}
  ...
  - {actionN}
```

## Errors
### ActionStructureError.and
If the `and` alias is used then the value array must contain more than one action.
```YAML
and: # throws ActionStructureError.and because it only has a single element
  - print: Hello World 
```
