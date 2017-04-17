# `prompt` action
Prompts the user to enter one or more values.

```YAML
prompt:
  "key": { prompt_options }
  ...
```

### keys _(required)_
Each key represents the key/path location in the session context to store the user-entered value. Multiple values can be prompted and collected with a single `prompt` action.

### values _(required)_
The value can either be a string or a prompt_options object. If the value is a string, it will be used as the "description" field for the prompt_options.

### prompt_options
#### description
The prompt text displayed to the user.
#### hidden
Boolean to indicate whether or not the user-entered text should be masked on the screen or not.
#### replace
The character to use for displaying hidden input. If omitted, no output will be shown.
#### required
Boolean to indicate whether the user should be prompted even if a matching value already exists in the session for the key.
#### pattern
A regex pattern that the input must match against.
#### type
The data-type for the input.
#### default
The default value to use if no value is entered.

## Notes
### Prompting for non-required values
Hyperpotamus will check to see if a value already exists in the session for the specified key. If the value already exists, the user will not be prompted for the value unless the field is marked with `required: true`. This makes it easy to prompt users to enter values for parameters if they did not specify them via some other means.

## Examples
Prompt the user for credentials
```YAML
- prompt:
    username: Please enter your username
    password:
      description: Please enter your password [hidden]
      hidden: true
```
