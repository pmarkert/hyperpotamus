# `exec` action [_unsafe_]
WARNING: This action is marked as "unsafe" for use by untrusted scripts.

Executes an external (shell) process on the system.

```YAML
exec: "shell command to run" # String value is equivalent to .command
```

```YAML
exec:
  command: "shell command to run"
  options: # Passed as options to childProcess.exec
    env: { } # Environment Variables
    cwd: "." # Working directory for the command
  stdout: "key/path for stdout results"
  stderr: "key/path for stderr results"
```

If the entire value of `exec` is a string, then it will be used as the value of the `.command` property.

### `.command` property _(required)_
The shell command to be executed.

### `.options` property
Additional options to be passed to node.js the childProcess.exec method. Typical options include environment variables and the cwd (current working directory).

### `.stdout` property
If specified, the session key/path for where to save output from stdout. Output is saved as a string. If not specified, contents will be emitted as with a `print` action.

### `.stderr` property
If specified, the session key/path for where to save output from stderr. Output is saved as a string. If not specified, contents will be emitted as with a `print` action.

## Notes
To prevent stdout and/or stderr output from being emitted, use the respective properties to assign the results to a session value.

## Examples
```YAML
- exec:
    command: "echo $VAR"
    options:
      env:
        VAR: foo
```

## Errors
### ProcessExecutionError
An error occurred while attempting to execute the external process. The command itself might have been invalid or the process might have returned a non-zero error code.
