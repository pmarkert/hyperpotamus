# `actions` action
Executes an array of nested actions in sequence. Each action must pass; if any child action fails then
processing stops and the error will be passed through.

```YAML
actions:
  - {action1}
  - {action2}
  ...
  - {actionN}
```

The `actions` action is useful to turn any element expecting a single action into a block of multiple actions. (For example, `.on_success`, `.on_failure`, `.response`, `.then`/`.else`, and other properties that represent a nested action).


## Aliases
```YAML
# An "and" action
and:
  - {action1}
  ...
  - {actionN}
```  
when using the [and](and) alias, the array must have more than one action.

```YAML
# A raw array of actions
- {action1}
...
- {actionN}
```

## Examples
```YAML
- if:
    equals: [ <% customer_is_happy %>, false ]
  then: # technically only expects a single element, but multiple actions can be wrapped within an 'actions' element.
    actions:
      - print: "The customer was not happy"
      - set:
          free_pizza: true
```
