# `print` action
Prints a message to the output stream.

```YAML
"Message" # => { print: { message : "Message" } }
```
or
```YAML
print: "Message" # => { print: { message : "Message" } }
```
or
```YAML
print:
  message: "Message"
  channel: "channel_name"
```

# Alias (`emit`)
The `emit` action is an alias for `print`.

### `.message` property _(required)_
The string message to be output.

### `.channel` property
The name of the channel to which to direct the message.

## Notes
#### Channels
Hypeprotamus allows multiple channels to be specified. Each channel can be directed to a separate output file or stream. For example, two slightly different reports can be produced processing the same data and sent to different files. For more information about using channels, see the documentation for the cli.

## Examples
Rolling 2 random dice
```YAML
"<% | random(1,6) %>, <% | random(1,6) %>"
```
Printing the status of a customer object
```YAML
- print: Customer status is : <% customer.status %>
```
