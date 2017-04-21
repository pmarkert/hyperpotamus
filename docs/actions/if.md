# `if` action
Processes the specified conditional action and then executes either the `.then` actions if successful, or the `.else` actions if the conditional action fails.

```YAML
if:
  { conditional action }
then:
  { success actions }
else:
  { failure actions }
```

### `if` property _(required)_
An action that will be executed to determine which branch to take. 

### `then` property
An action (or combination of actions) that will be processed if the conditional action is successful.

### `else` property
An action (or combination of actions) that will be processed if the conditional action fails.

## Examples
```YAML
if:
  equals: [ <% record_count %>, 0 ] 
then:
  print: "Zero records returned"
else:
  - print: "<% record_count %> results available"
  - goto: "Record Processing"
```

## Notes
#### The conditional action
As always, the conditional action can be a combination of actions, making use of the boolean `and`, `or`, and `not` actions. If the action fails (raises an error), the action is considered false.
