# `not` action
Reverses the failure state of the nested action. If the nested action fails, then the not will swallow the error and return a success. If the nested action succeeds, then the `not` action will raise an error.

```YAML
not: {action}
```

## Errors
### NotConditionFailed
The nested action did not fail.
```YAML
not: true # Raises  a "NotConditionFailed" error
```
