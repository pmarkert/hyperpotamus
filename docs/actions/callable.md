# `callable` action
Identifies the nested action(s) so that they are skipped during the course of normal script processing flow. The action(s) may be directly invoked using the [`call`](call) action.

This is similar to how many programming languages allow for the declaration of functions/methods which are not processed until explicitly invoked.

```YAML
callable: {action}
```

```YAML
callable:
  - {action}
  - {action}
```

## Notes
`callable` is useful for providing re-usable sections of script that can be invoked from other spots within the script. Callable actions are only useful when combined with a `.name` so that the action(s) can be targeted by a `call` action. See the documentation for the `call` action for more information.

## Example
```YAML
# prints "1", "foo", "2, "foo", "3", "foo"
- name: foo
  callable:
    print: "foo"

- print: "1"
- call: foo
- print: "2"
- call: foo
- print: "3"
- call: foo
```

When a `callable` action is encountered during the normal course of script processing, it is treated as a noop (empty) operation.
