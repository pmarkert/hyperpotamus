# `compare` action
Compares the elements in an array based upon the specified operator. Each element in the array is compared to the previous element. If any comparison fails, then the action fails with details of the mismatch.

```YAML
compare:
  array: # Array of values to compare
  operator: # Operator to be applied
```

### `.operator` property _(required)_
Must be one of the following values:
- "=" (also "==")
- "<"
- ">"
- "<="
- ">="
- "!=" (also "<>")

### `.array` property _(required)_
The array or `<%! array_reference %>` on which to perform the compaison operations.

## Aliases
- "="
    - `equal`
    - `equals`
    - `equal_to`
- ">"
    - `greater_than`
- ">="
    - `greater_than_or_equal`
    - `greater_than_or_equals`
    - `greater_than_or_equal_to`
- "<"
    - `less_than`
- "<="
    - `less_than_or_equal`
    - `less_than_or_equals`
    - `less_than_or_equal_to`
- "!="
    - not_equal
    - `not_equals`
    - `not_equal_to`

Each of these aliases are shortcuts that will be normalized into a `compare` action with the corresponding .operator value applied. The value of the alias key will be used for the .array property.

```YAML
# Using the equals alias
equals: [ true, true ]
```

is normalized to:

```YAML
compare:
  operator: "="
  array: [ true, true ]
```

## Examples:
```YAML
compare:
   array: [ item1, ... itemn ]
   operator: "<>"
```

```YAML
equals: [ item1, item2 ]
```

```YAML
greater_than: [ 3, 2, 1 ]
```

```YAML
less_than_or_equal_to: [ 1, 2, 3 ]
```

```YAML
# Using an array reference
not_equals: <%! customer_ids %>
```

## Errors
### ComparisonTypeMismatch
The comparison of at least 2 values failed because the types of the 2 elements did not match.
```YAML
equals: [ "3", 3 ] # throws ComparisonTypeMismatch because of string vs. numeric
```

## ComparisonValueMismatch
The comparison of at least 2 values failed because the values did not pass according to the specified operator.
```YAML
equals: [ true, false ] # throws ComparisonValueMismatch because true != false
```

### InvalidComparisonOperator
The operator value is missing or is not one of the valid choices shown above.
```YAML
compare: 
  operator: foo # throws InvalidComparisonOperator because "foo" is not a valid operator.
  array: [ 1, 2, 3 ]
```

### InvalidComparisonType
The data-type of the first element to be compared was not a supported type. Valid comparison value types include:

* null
* strings
* numbers
* dates
* moments
* booleans

```YAML
equals: # throws InvalidComparisonType because comparing arrays/object is not supported.
  - [ a, b ]
  - [ a, b ]
```

### InvalidComparisonOperatorForType
boolean and null values can only be compared for equality/non-equality, but not for inequality.
```YAML
less_than: [ true, false ] # throws InvalidComparisonOperatorForType because true and false can't be compared for inequality
```

### InvalidComparisonTarget
The value of the .target property must be an array. This can either be a literal inline array in the YAML script or it can be an <%! object_reference %> to an array object in the session.
```YAML
compare:
  array: foo # throws InvalidComparisonTarget because "foo" is not an array
  operator: =
```

### InvalidComparisonTargetLength
The array being targeted for comparison must have at least 2 elements in it to perform comparison.
```YAML
equals: [ true ] # throws InvalidComparisonArrayLength because there is only one element to compare
```
