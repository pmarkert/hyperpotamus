# `default_response_actions` action
Modifies the default actions that hyperpotamus executes to validate the response to a request if no actions are specified in the `.response` property of a `request` action.

```YAML
default_response_actions:
  {action} | array of {action}
```

By default, if no actions are specified, hyperpotamus will ensure that the final status (after following redirects) is a 200 status. This is equivalent to:

```YAML
default_response_actions:
  status: 200
```

NOTE: The default_response_actions are only applied if there are _no_ actions specified in the `.response` section for a `request` action.
