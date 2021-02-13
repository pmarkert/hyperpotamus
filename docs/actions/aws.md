# `aws` action
Executes the specified AWS (Amazon Web Services) SDK call.

## Syntax

```YAML
aws:
  service: "Service" # AWS Service Name - ProperCase (i.e. "S3")
  operation: "operation" # "ApiMethod" - lowerCamelCase (i.e. "listBuckets")
  params: { Operation Parameters } # lowerCamelCase
  result: "result_key" # key in which to store API result

## Notes
- The AWS Service name is ProperCased
- The Operation name is lowerCamelCased
- API Parameter names are ProperCased
