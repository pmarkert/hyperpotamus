# `aws` action
Executes the specified AWS (Amazon Web Services) SDK call.

## Syntax

```YAML
aws:
  service: "AWS Service Name"
  invoke: "ApiMethod"
  params:
    { Operation Parameters }
  result: "key in which to store API result"

## Notes
AWS API Parameter names are camelCase
