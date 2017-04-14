# `function` action [_unsafe_]
WARNING: This action is marked as "unsafe" for use by untrusted scripts.

Executes the inline javascript function.

```YAML
 - function: !!js/function >
     function (context) {
        // content here
     }
   imports: # key/value pairs or array of values.
```

or

```YAML
- !!js/function >
    function (context) {
      // function
    }
```

## Alias: inline function
A literal function will be wrapped into a `function` action with the appropriate `.function` property, but no `.imports` or additional properties can be specified using that shortcut syntax.

#### `.function`
The javascript literal function value. Javascript functions must be specified in YAML and are not able to be represented in JSON. The yaml type specifier is !!js/function and it is usually useful to combine this with a block-literal ">" specifier to allow for multi-line definition.

The function may either take a single parameter (the hyperpotamus session context) or 2 parameters (the context and callback). If the function takes 2 parameters, callback must be invoked using a node-style error-first callback. If only a single parameter is declared, then the function may return a promise. The `this` context for the function will be bound to the action element itself.

For more information about the hyperpotamus context, see the embedded documentation.

#### `.imports`
The .imports property allows either a key/value map or an array of values to be specified for libraries to be imported. Each value will be replaced by the resulting module when doing a `require` of the value. Any of the existing built-in node.js modules may be imported and absolute paths to local modules may also be used. The custom javascript can access the imported modules using the `this.imports` property.

## Notes
#### `this` binding.
When the custom function is invoked, the action element will be bound to `this`. The function can reference embedded `.imports` elements or other miscellaneous properties by referencing the `this` element.

#### `.imports` path location
`.imports` can be used to import external modules, however relative paths (such as './lib/utils') will not work as expected. Relative paths are resolved according to node.js' documented module location rules which will search for the files relative to the script executing the `require` command. For this reason, module values should either be built-in, or referenced via an absolute path.

#### The context object
The context object is used by functions to interact with hyperpotamus. Key methods on the context are `getSessionValue('key/path')`, `setSessionValue('key/path', value)`, `processAction(action)`, `emit(value)` and `interpolate(target)`. For more documentation on the context, see the embedded documentation.

## Example
```YAML
# Contrived example, but parse a session value "callback_url" to see if the hostname matches
# "dev_" + expected_hostname
- function: !!js/function >
    function(context) {
      var callback_url = context.getSessionValue("callback_url");
      if(this.imports.url.parse(callback_url).hostname==this.expected_hostname) {
        context.emit("url matches hostname");
      }
    }
  imports:
    url: url # node.js url library
  expected_hostname: dev_<% expected_hostname %>
```

In this example, you can see the use of the context object to read a session value, make use of an imported library, make use of an interpolated extension property on the action, and to emit a value for logging.
