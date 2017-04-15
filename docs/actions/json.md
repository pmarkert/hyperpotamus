# `json` action
Executes the specified [JSONPath](http://goessner.net/articles/JsonPath/) expressions against an HTTP response or a specific target object to extract values.

```YAML
json:
  key: "JSON_Path Expression" | [ "JSON_Path Expressions" ]
target: # Optional object reference 
```
or
```YAML
json: [ expression1 ... expressionN ]
```

### `.json` as object
If `.json` is an object, then each key in the `.json` value represents the path where the results of the JSONPath expression will be stored into the session context. By using multiple keys, multiple captures can be processed with a single instance of the `json` action. The value of each of the key is the JSONPath expression to be executed for that capture. 

When the expression value is a string, then only the first match will be stored. If the JSONPath expression is wrapped into an array by itself, then all matches will be stored into the target value as an array, even if only a single value is matched in the target.

### `.json` as an array
If `.json` is an array of JSONPath expressions, then each of the expressions will be evaluated to ensure that at least one match is found in the target. If any of the matches fail, then an error is raised. The results of the matches are not stored anywhere, but are discarded.

### `.target`
If a target is not specified then the current HTTP response will be used as the target. If a `.target` is specified, then it should be a inline object (or of course an <% object_reference %> to an object). If the target value is a string, it is not treated as a key/path, but instead the value of the string will be parsed as JSON.

## Notes
#### Optional matches
By default, if the JSONPath expression does not match anything, then an error is returned. In order to allow missed matches to be ignored, prefix the key with a "?" character. 

```YAML
json:
  "?optional_value": "$.child.missing_value"
```

## Errors
### JsonValueNotMatched
The JSONPath expression did not match any values against the target.

### JsonPathError
The JSONPath expression was not valid.

### InvalidActionPlacement.json
No `.target` was specified and there was no current HTTP response to use.

### InvalidJsonTarget
The `.target` was invalid or missing.

### InvalidJSONCaptureValue
The value of a `.json` capture key must either be a single expression or an array of a single expression.
