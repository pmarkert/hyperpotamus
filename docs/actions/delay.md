# `delay` action

Sleeps (delays) for a specified number of milliseconds.

```YAML
 - delay: milliseconds_to_delay
```

The value, which can include the use of macro expressions, must resolve to an integer number.

## Examples
```YAML
- delay: 500 # Sleep half a second
```

```YAML
- delay: <% think_time %>
```

## Notes
#### Randomized delays
The delay action can be combined with the `random` pipe to simulate more realistic user traffic, for a non-deterministic pause.

```YAML
- delay: <% | random,1000,2000 %> # Sleep a random amount between 1 and 2 seconds
```
