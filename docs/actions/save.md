# `save` action [_unsafe_]
warning: this action is marked as "unsafe" for use by untrusted scripts.

Saves the current HTTP response or otherwise specified `.content` to a file on disk.

## Syntax
```YAML
save:
  filename: "/path/to/save.ext"
  encoding: UTF-8
  content: <% some_key %> # Optional string or buffer object
```

## Properties
### `save.filename` property _(required)_
The filename specifies where to the file path on disk for where to save the content.

### `save.encoding` property
Specifies the encoding to be used when saving the object. If omitted, defaults to "UTF-8"

### `save.mode` property
The file permissions mode to use when writing. Node.js defaults to 0o666 if not specified.

### `save.flag` property
The access flag to use when saving the file. Node.js defaults to "w" if not specified.

### `save.content` property (alias `save.target`)
The content to be saved. If the value is not a string or buffer, .toString() will be called on it. If `.content` is not specified, then the current HTTP response will be used.

## Errors
### InvalidActionPlacement.save
The `save` action must either specify a value for `.content` or be placed inside of the `.response` section of a `request` action.

## Examples
Saving an object as json to a file
```YAML
- set:
    object_to_save:
      fruit: [ apples, bananas, cherries ]
      children: 3
- save:
    filename: "path/to/filename.ext"
  content: <% object_to_save | json %>
```
