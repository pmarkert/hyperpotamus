# `goto` action
Jumps processing to the named top-level action.

```YAML
goto: named_action
```

The `goto` action interrupts the current processing flow and jumps to the named action. Script processing will begin with the named action and proceed until the end of the script is reached. Unlike the `call` action, processing does not specifically return to the point of the call when the script is completed.

## Notes
#### Eligible targets
The `goto` action is able to jump to any top-level named action within the script. A named action is any action that specifies a `.name` property. Top-level actions imported via the !!inc/file YAML directive are also eligible.

#### Used with `callable`
Goto statements will not process nested actions inside of a `callable` action, which can only be executed with a `call` action.

## Examples
The following example prints "foo", "bazr":
```YAML
- print: "foo"
- goto: landing_zone
- print: "bar"
- name: landing_zone
  print: "baz"
```

## Errors
The following errors may be thrown by the `call` action.
### InvalidGotoValue
The value of `goto` was not a string value. The string should represent the name of a top-level script action.

### StepNotFound
No matching named step could not be found in the script.
