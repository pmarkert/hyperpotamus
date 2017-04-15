# `load` action [_unsafe_]
warning: this action is marked as "unsafe" for use by untrusted scripts.

Loads the contents of each of the specified files from disk into the session context under the corresponding keys/paths. If the file is loaded as YAML/JSON, then it will be stored as an object, otherwise, the contents will be loaded according to the optionally specified encoding (defaulting to UTF-8).

```YAML
- load:
    "file_key": "/path/to/somefile.ext"
    "yaml_file": { yaml: "/path/to/somefile.yaml" } # also "yml" or "json"
    "text_file": { file: "/path/to/someotherfile.txt" } # or ".filename"
    "binary_file": { file: "/path/to/binary.ext", encoding: "binary" } # or binary: true
```

If the value of any of the key is just a string, then the string value will be used as the filename and the extension of the file will be used to detect whther or not to load the file as YAML/JSON (*.yml, *.yaml, and *.json) or text (anything else).

## `.yaml` (alias `.json` and `.yml`)
Parses the file contents as YAML/JSON an stores the results as an object in the session.

## `.file` (alias `.filename`)
The filename/path of hte file to load.

## `.encoding`
Can either be "binary", or a valid encoding such as "UTF-8"

## `.binary` (boolean)
If true, then encoding will be forced to "binary".
