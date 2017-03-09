# `callable` action
allows one or more actions to be directly invoked in response to an [execute](execute) action, but the same actions are skipped if the action is encountered in the normal processing flow.

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
