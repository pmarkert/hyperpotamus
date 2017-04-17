# `noop` action
Short for "no operation", this action literally does nothing. It is primarily used for unit testing, but can also be used as a place-holder whenever a nested action is required.

```YAML
noop: ... # The value of noop does not matter. It can be anything.
```
or
```YAML
true # => { noop: true }
```
