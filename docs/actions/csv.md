# `csv` action

Outputs a comma-separated values string for all session values referenced by the specified `.fields` array, applying any specified calculations/transformations specified in the `.mapping`, and properly escaping special characters. Optionally prints a header row with the field names.

The `csv` action outputs one row for each item in any iteratable array fields until at least one array is exhausted.

```YAML
 - csv:
    fields: array_path | [ array ] | <%! array_reference %>
    header: true | false | "only" # defaults to false
    mapping:
      field_A: <% mapping_expression %>
      other_field: "static value"
    iterate: [ array_path_to_iterate, ... ]
```

For unmapped fields, the values will be retrieved from the current session using the field name as the key/path. The selected values may be a mixture of arrays and simple values. For any array values, one row will be output for each item in the array(s). For non-array values, the value will be used for each row.

### `.fields` property _(required)_
The values in the `.fields` array must either be the key/path to a session variable, or must have a value provided under the `.mapping` section.

### `.mapping` property
A key/value map object (keyed by the field name) that allows an expression to be used to determine the value of mapped fields. The mapping expression can include macro/pipe syntax to format/calculate the value of the field.

### `.header` property
If truthy, an additional header-row will be prepended to the output using the field-names. As a special case, if the value of `.header` is the string "only", then the header row will be output, but no values will be processed.

### `.iterate` property
An list of array paths to add to the per-row iteration process (see Notes).

## Examples
```YAML
 - csv:
    array: [ name, address, city, state ]
    mapping:
      state: <% state | upcase %>
```

 or

```YAML
 - csv: [ "name", "address.street", "address.city", "address.state", "address.zipcode", "ssn" ]
 ```

## Notes
#### Headers
The `.header`='only' option is useful to output the csv header at the beginning of a script when the values will be output with one or more `csv` actions inside of a loop (don't want to have multiple header rows mixed into the middle of a report).

#### Array Fields
Each unmapped array value in the `.fields` list will use the current value of the array in the row output; all of the unmapped arrays are then iterated to the next position so that the row output can be repeated until at least one of the arrays is exhausted. The intention is to allow multiple arrays of the same size to be lined-up as columns in a report.

Ragged-length arrays, while technically supported, are probably not going to behave as expected. The current array position of any fields is not automatically reset before processing by the `csv` action, so unexpected results may occur. When the shortest ragged array is exhausted, the other arrays will have "dangling" items at the end. If the same arrays are used again in a `csv` action, the longer arrays will start in the middle because they still had remaining elements to be processed.

Any array fields that have an explicit mapping will not be automatically iterated with the unmapped array fields. This is intentional behavior. To cause mapped array values to be iterated, add the name/path of the array to the .iterate property. This behavior allows some arrays to be "locked in place" by specifying a mapping that uses the `| current` pipe.
