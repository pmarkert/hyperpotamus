# `request` action
Sends an HTTP request and applies the specified actions to the response. This action makes use of the npm [request](http://github.com/request/request) module.

## Syntax
```YAML
request:
  { request_options }
response: 
  { response_actions }
```

## Properties
### `request` property _(required)_
The request property specifies the parameters for the request. For extensive documentation about the available options, see [http://github.com/request/request](http://github.com/request/request). See the documentation for the `request_defaults` and `cookies` actions for information about other actions that can modify the default configuration values for request properties.

The most important properties include

#### request.url
The url for the request.

#### request.method
The HTTP method (usually one of GET, HEAD, POST, PUT, DELETE, PATCH, or OPTIONS)

#### request.json | request.form
The request body data as an object to be submitted either as json or form/url-encoded.

#### request.auth
Authentication information such as username/password or a bearer token.

#### request.headers
Other HTTP headers to be sent with the request.

### `response` property
The action(s) to be executed once the response is received.

## Notes
### User-agent
The default user-agent setting clearly identifies the hyperpotamus application with a version identifier and a link to the original github repository. This setting can be overridden by specifying an explicit value for the "user-agent" header.

## Errors
### ResponseActionError
Wraps any error thrown by a nested response action, providing additional context information.
```YAML
# Raises a ResponseActionError, wrapping the nested failure.
request:
  url: http://hyperpotamus.io
response:
  fail: "Failing on purpose"
```

## Examples
Sending a json POST request
```YAML
request: 
  url: http://httpbin.org/post
  method: POST
  json:
    fruit: [ apples, bananas, cherries ]
```
