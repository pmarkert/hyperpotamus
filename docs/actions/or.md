# `or` action
The or action succeeds if and only if at least one of the nested actions succeeds. Short-circuit evaluation is performed such that as soon as any nested action succeeds, the remaining actions are not processed.

```YAML
or:
  - {action1}
  ...
  - {actionN}
```  

## Errors
### OrConditionFailed
All nested conditions failed.
```YAML
# Raises an OrConditionFailed error
or: 
  - false
  - false
```
