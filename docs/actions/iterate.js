# `iterate` action
Advances the current item for one or more arrays to the next index index, jumping to the specified `.next` target if all of the arrays had at least one element remaining. If any of the arrays were exhausted (meaning there were no more elements), then the action will fall-through (continue) processing the rest of the script.

```YAML
iterate: array_key | [ array_key1 ... array_keyN ]
next: jump_to_key
```

### `.iterate` property _(required)_
A session key/path or an array of session keys/paths to the arrays to be iterated.

### `.next` property
The `.next` property may either be an action or the name of a top-level action or one of the special jump directives ('END', 'SELF', 'NEXT'). If all arrays were able to be iterated, then the `.next` action is executed. If `.next` is not specified, then 'SELF' is used to repeat the current top-level action.

## Notes
In hyperpotamus, arrays can keep track of a current index that is able to be used to retrieve the current element with <% array_key | current %>. By using the iterate `action` the current index for the array is advanced to the next element until the end of the array is reached. When the end of the array is reached, the array is considered exhausted. Restarting iteration on an exhausted array starts over at the beginning of the array.

## Example
The following script will print each of the fruits in the array and then "All done".
```YAML
- set:
    fruit: [ apples, bananas, cherries ]

# Print each item and then iterate, repeating this action until exhausted.
- actions:
   - print: <% fruit | current %> # apples
   - iterate: fruit
  
# Once the array is exhausted, processing continues
- print: "All done"
```
