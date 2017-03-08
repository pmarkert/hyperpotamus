# `compare` action
Compares the elements in an array based upon the specified operator. Each element in the array is compared to the previous element. If any comparison fails, then the action fails with details of the mis-match.

## Structure
```YAML
compare:
  array: # Array of values to compare
  operator: # Operator to be applied
```

Valid operators are
* = (also ==)
* <
* >
* <=
* >=
* != (also <>)

## Aliases
Each of these aliases will be normalized to a `compare` action with the appropriate .operator applied. The value on the right-hand side will be used for the .array property.

- "equal" or "equals" or "equal_to"
- "greater_than"
- "greater_than_or_equal" or "greater_than_or_equals" or "greater_than_or_equal_to"
- "less_than"
- "less_than_or_equal" or "less_than_or_equals" or "less_than_or_equal_to"
- "not_equal" or "not_equals" or "not_equal_to"

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
The data-type of the values to be compared were not a supported type. Valid comparison value types include:

* null
* strings
* numbers
* dates
* moments
* booleans
```YAML
equals: # throws InvalidComparisonType because comparing objects is not supported.
 - { object: true }
 - { object: true } 
```

### InvalidComparisonOperatorForType
boolean and null values can only be compared for equality or non-equality
```YAML
less_than: [ true, false ] # throws InvalidComparisonOperatorForType because true and false can't be compared for inequality
```

### InvalidComparisonType
The value of the .target property must be an array. This can either be a literal inline array in the YAML script or it can be an <%! object_reference %> to an array object in the session.
```YAML
compare:
  array: foo # throws InvalidComparisonType because "foo" is not an array
  operator: =
```

### InvalidComparisonArrayLength
The array being targeted for comparison must have at least 2 elements in it to perform comparison.
```YAML
equals: [ true ] # throws InvalidComparisonArrayLength because there is only one element to compare
```
