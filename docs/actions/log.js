# `log` action
Logs a message at the optionally specified logging level.

```YAML
log: "message to log" # defaults to INFO
```
or
```
log:
  message: "Message to log"
  level: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL"
```

### `.message` property
The message to be logged.

### `.level` property
The logging level to set for the message. One of [ "TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL" ] or a number from 1 (FATAL) to 6 (TRACE).
