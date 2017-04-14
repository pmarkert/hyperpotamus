# `headers` action

Captures content from or validates assertions about HTTP headers returned from the current web request.

```YAML
 - headers:
    header-name: 
      text: "text to match"
        or
      capture: "key/path to store header value"
        or
      regex: !!js/regexp | "/pattern/opt" | { pattern: "pattern", options: "gim" }
```

Multiple headers can be processed with a single `headers` action. Each key in `.headers` represents a header name to be operated on. The value may be either a `.capture`, a `.regex`, or a `.text` object. 

## Examples
```YAML
# Check the redirect url
- headers:
    location:
      text: <% expected_redirect_url %>

# Capturing the content-type
- headers
    content-type: "content_type"
- print: Content type was <% content_type %>

# Check for english language
- headers:
    language: "/^en.*/"

# Capture part of a header value using a named regex
- headers:
    cache-control: "/max-age=(:<max_age>\d+)/"
- print: Max age is <% max_age %>
```

## Notes
#### Heuristic for string values normalized to `.regex` or `.capture`
If the value for any of the  `.headers` keys is a plain string, hyperpotamus will attempt to see if it looks like "/pattern/" or "/pattern/opt". If so, it will normalize the string into a `.regex` element. Otherwise, it will normalized into a `.capture` element.
