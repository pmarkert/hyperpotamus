# `load` action [_unsafe_]
WARNING: This action is marked as "unsafe" for use by untrusted scripts.

Loads file contents from disk into the session. The value of the `load` action is a key/value map of file paths to be loaded into the corresponding session keys.

```YAML
load:
  "key": "path" # a string value is equivalent to .filename
```
or
```YAML
load:
  "key":
    filename: "path"
    yaml: boolean # also .yml or .json
    # other options for fs.readFile
```

The `load` action value may contain multiple keys, each of which will be loaded. The "key" represents the session key/path for where to put the resulting contents.

The value on the key can either be a string (in which case it is treated as if it were the `.filename`) or it may be an object.

For value objects:
### `.filename`
The path of the file to be loaded from disk.

### `.json` or `.yaml` or `.yml`
A boolean value to indicate whether the file contents should be loaded and parsed as JSON/YAML. If so, the results will be stored as an object.

If the filename extension of the file being loaded is '.json', '.yml', or '.yaml', then this flag will be default to true.

### `.binary`
Boolean value to indicate whether to load the file contents as binary. If `.asBinary`==true, then the file contents are stored in the session as a node.js Buffer object, otherwise the default behavior is to store the contents as a string according to the specified encoding.

### `.encoding`
The encoding to be used when reading the file as a string. (defaults to 'UTF-8')

## Example
```YAML
load:
  json_file: "sample.json"
  txt_file: "license.txt"
  pdf_file:
    filename: "document.pdf"
    binary: true
  another_text_file:
    filename: "other.txt"
    encoding: "UTF-8"
```
