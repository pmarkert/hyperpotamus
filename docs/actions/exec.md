# `exec` action ___unsafe___
Executes an external (shell) process on the system. This action is not marked as "unsafe" for use by untrusted scripts.

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
