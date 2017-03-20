# `call` action
Invokes processing of the named top-level action and returns to the point of the call to continue processing once the called action completes.

```YAML
call: named_action
```

The intention of the `call` and `callable` actions are to allow for modular, resuable sections within a script or imported script blocks. There may be common processing that needs to happen to extract data from responses in a common format or to handle/respond to errors.

## Notes
#### Eligible targets
The `call` action is able to execute any top-level named action within the script. A named action is any action that specifies a `.name` property. Top-level actions imported via the !!inc/file YAML directive are also eligible.

#### Used with `callable`
While the `call` action can be used to invoke any type of action, it is sometimes useful to ensure that the called action(s) are not executed as part of the normal script processing flow. (i.e. the named action should only be processed when explicitly invoked). The `callable` action can be used to achieve this capability; wrap target actions within a `callable` action and those actions can only be triggered when explicitly invoked using `call`.

#### Compared to `goto`
The `call` action is similar to the `goto` action in that they can both cause execution to jump to another named target in the script. The primary difference is that with the `call` action, upon completion of the called action, the execution flow returns to the point of the call. This similar to calling a function, method, or sub-routine in most programming languages.

## Examples
To demonstrate the `call`, `callable`, and `goto` actions, consider the following examples and outputs:

When using `call` and `callable`, the callable acts like a function/method declaration and is only processed when called directly. The `callable` action is skipped when processing continues.

The following example prints "foo", "bar", "baz", and "bat":
```YAML
- print: "foo"
- call: "target"
- print: "baz"
- name: "target"
  callable:
    print: "bar"
- print: "bat"
```

However, `call` can be used to execute any named top-level action. If the action is not specifically `callable`, then it will execute both when called and then again during the normal processing flow.

This example prints "foo", "bar", "baz", "bar", and "bat":
```YAML
- print: "foo"
- call: "target"
- print: "baz"
- name: "target"
  print: "bar"
- print: "bat"
```

Compare that to using a `goto` which will jump to the named action, but does not return to the point of call when finished.

This example prints "foo", "bar", and "bat":
```YAML
- print: "foo"
- goto: "target"
- print: "bar"
- name: "target"
  print: "bar"
- print: "bat"
```

Finally, consider the case of using a `goto` action with a `callable`. With this combination, the `callable` action never gets executed.

This example only prints - "foo" and "bat":
```YAML
- print: "foo"
- goto: "target"
- print: "bar"
- name: "target"
  callable:
    print: "bar"
- print: "bat"
```

## Errors
The following errors may be thrown by the `call` action.
### InvalidCallValue
The value of `call` was not a string value. The string should represent the name of a top-level script action.

### StepNotFound
No matching named step could not be found in the script.

