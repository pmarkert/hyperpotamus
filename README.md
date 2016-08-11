# hyperpotamus
YAML based HTTP script processing engine

This README just scratches the surface and gives you enough information to know what hyperpotamus tastes like to either 
get excited or scratch your head and wonder why anyone would be interested. For those who get excited, it is worth 
reading the [Hyperpotamus documentation wiki](http://github.com/pmarkert/hyperpotamus/wiki)

### What does hyperpotamus do?
Hyperpotamus allows you to write simple, human-readable scripts using any text-editor to describe a sequence of web (HTTP/s) requests
and actions that you want to take to verify or capture data from the responses. Hyperpotamus scripts support multi-step
processes where you retrieve information from one request to use in a subsequent request. For example, you may need to
retrieve a listing of photos from one page before you select one or all of them to download.

### Why might someone want to do this? 
There are many reasons that I have needed to use such a tool in my own career, including:
* Setting up an automated suite of integration/regression tests for a new web-application
* Creating a monitoring system that checks on a periodic basis to make sure a website or webservice is working
* Invoking a JSON-based API to send requests, retrieve data and submit updates
* Stress-testing a web application for performance optimization and tuning
* **Boss:** Hey, we need to get all of these products entered on the customer's website by tomorrow morning, but they don't have any automated API. 
  I need you guys to fill out the 3-page form on their website to submit each one of these 5,000 items? You guys didn't have any plans tonight did 
  you? I'll buy pizza!!

  **Me:** Send me the spreadsheet and give me about 20 minutes... oh, and deep-dish, please.

### Sounds awesome, but do I have to be a ninja to use it?
Well, it depends upon how complicated your scripting needs are. :) You can write some pretty simple scripts in just a few
seconds. I've tried to make the scripting as easy and accessible as possible. There are lots of features in hyperpotamus 
that aim to make it easy to write scripts. In spite of that simplicity, however, there is quite a lot of power when you are
ready to dig deeper. 

Hyperpotamus is at the core a processing engine that can be embedded into other software, but it comes with a command-line
program that you can use to drive it; there is currently no graphical user-interface, but I'm open for contributions if
anyone is interested. 

If you can use a text editor and know how to use your computer's terminal/command-prompt to run some basic commands, then you
have the technical skills you need to get started. Give this quickstart a try; if you make it through without crying, then
you have what it takes. ;) 
If, on the other hand, you do end up crying, don't give up! Persistence pays off and builds character 
-- [Romans 5:3-4](https://bible.com/59/rom.5.3-4.esv)

## Quickstart
Let's assume that you already know how awesome it would be if you had the power to automate the www's right at your
fingertips. Let's get started.

1. Make sure you have [node.js](http://www.nodejs.org/) installed. Installing nodejs will also install npm, the node package manager.
2. Open a command-prompt/terminal on your computer and type:
 ```
 npm install -g hyperpotamus
 ```
3. Create a text-file called "first.yml" with the following contents:

 ```yaml
 request: https://github.com/pmarkert/hyperpotamus
 response: YAML based HTTP script processing engine
 ```
4. Execute your script with
 ```
 hyperpotamus first.yml --verbose
 ```

If it worked, then you should see nothing-- pretty anti-climatic right? But WAIT! There's more!

So what just happened? You made a script that requests the webpage specified on the first line and then checks to make sure
that the text on the second line appears somewhere on the page.

If you run the script again adding a few verbose flags (-vvv) you will see what hyperpotamus is doing. The more v's you add,
the more output you get. 

## Some sample scripts
The hyperpotamus YAML syntax attempts to be as simple and fluid as possible. There are lots of syntax shortcuts and sensible
defaults -- less is more. 

NOTE: All of these scripts can be found under /examples

#### Super-simple script 
examples/super-simple.yml

```yaml
http://www.google.com
```

This script makes a request to the url and then runs the default validation rules. The default validation rules make sure
that the request returns an HTTP 200 OK status code, but you can change that. 

Paste the script it into a text file called `super-simple.yml` and run it with a few verbose flags like so: 

`hyperpotamus super-simple.yml -vv`. 

#### Multi-step scripts

This script contains two separate steps, specified as a YAML array (with the - character). Each step makes a request to a
different url. 

examples/two-step.yml
```yaml
- http://www.google.com
- http://www.github.com
```

If your script only has a single step as in the previous "super-simple" example, then you you can leave out the array and hyperpotamus will figure out what you meant.

#### Shortcuts 
Up until now we have been using some shortcuts. Hyperpotamus allows and encourges you to use shortcuts to keep your scripts simple. 

One of the shortcuts that we have been using is that for each step, we did not have to specify the "request" property. If you
do not need to modify the default validation rules for a step, then hyperpotamus lets you treat the whole step as the request
configuration.

The second shortcut that we have been using is that if the request only needs to specify the url, then you do not need to
include the "url" property of the request configuration.

examples/equivalent.yml

```yaml
# The following steps are all equivalent: 
- http://github.com/pmarkert/hyperpotamus
- request: http://github.com/pmarkert/hyperpotamus
- request: 
   url: http://github.com/pmarkert/hyperpotamus
```

If you want to see how hyperpotamus understands and expands your script, run it with the --normalize flag and you will see
the expanded version of your script in both JSON and YAML forms. This can also be helpful when troubleshooting indentation
problems in your YAML.

#### Customizing the request
Hyperpotamus makes use of the most excellent [request module](https://github.com/request/request), so any option supported by
[request](https://github.com/request/request) should work.  Some common customizations you may want to use include:

* modifying the HTTP method 
* modifying standard headers like user-agent, accept-language, cache-control, etc.
* sending cookies
* setting custom headers
* posting JSON, Form URL Encoded data, or multi-part file uploads
* requesting through proxy servers
* automatically following redirects

#### POST example `examples/custom-request.yml`
```yaml 
- request: 
   url: http://www.httpbin.org/post
   method: POST
```

#### Checking the content of the response
Sending requests with hyperpotamus is really only part of the story. Hyperpotamus also allows you to check or capture parts 
of the response as well.

```yaml
request: http://www.nodejs.org
response: This simple web server written in Node responds with "Hello World" for every request.
```

The response configuration allows you to handle the HTTP response to validate, capture data, or take other actions. If your 
response action is a plain string,
as in this example, then it is a shortcut for `text: "..."`.  A text action which will look for the exact (case-sensitive) 
text in the response body. If the
text is not found, an error is raised. If the text is found, then the script continues processing.

#### Validating HTTP Status codes
```yaml
request: http://httpbin.org/status/404
response: 
 - status: 404
 # or the equivalent short-cut
 - 404
```

Status actions verify that the HTTP status code from the response matches what you expected. As a shortcut for a status 
action, you can just supply the status code as an integer. 

#### Request/Response defaults
All of the scripts we have used above have made use of the shortcut that steps can directly specified at the top-level of the
configuration. If you want to configure default values for requests and/or responses, then you will have to explicitly use 
the "steps" element.

Default values can be specified under the top-level "defaults" element. Any request options specified here will be merged 
with values in your actual steps. If the same values are specified in a step's request, then the values from the step will 
take precedence.

```yaml
defaults:
 request: 
  # these headers will be added to all requests
  headers:
   Accept-Language: us-en

steps:
 - request: 
    url: http://httpbin.org
```

Likewise, you can also modify the default response actions for all steps. Unlike the request defaults where values are merged
together for each step, response values will only be applied if no response/actions element is specified for a step.

As mentioned above, the default options for response validation include a check for `status: 200`. You change this behavior 
by overriding the response defaults.

`examples/request-defaults.yml`
```yaml
defaults:
 response:
  - not: "An Error Occurred"

steps:
 - http://httpbin.org
 - http://httpbin.org/404
```

Normally the second step would have failed (because httpbin.org will return a 404 error code), however in this case, we setup
a default validation rule to be that the page may not include the text "An Error Occurred". Setting up this default rule
removed the existing default status-code check.

NOTE: If you wish to remove the default status code check but do not want to add any other rules, just set defaults.response
to an empty array.
```
defaults: 
  response: []
```

#### Regex validation
```yaml
request: http://www.nodejs.org
response: /simple web server/i
```

[Regex](http://www.regular-expressions.info/) actions (delimited by the '/' characters around the text) are a shortcut for 
`{ regex : { pattern : "...", options : ".." } }`. 

Regex actions also match against the response content, but may contain wild-cards, patterns, captures, and other options. 

NOTE: If your regex pattern contains certain character combinations, it may invalidate the YAML syntax of the script (for
example ": " in the middle of the pattern or other special YAML characters). In that case, you can always enclose your
pattern in double or single quotes and it will still be treated as a regex as long as it still looks like "/regex/options". 

In this example the case insensitive option is specified with the /i option.  Valid regex options are "g" (global), "i" 
(case-insensitive), and "m" (multi-line). 

#### Writing your scripts in JSON
Of course, JSON is also valid YAML, so if you roll that way, this script is equivalent to the previous one. 

```yaml
[
  {
    "request": "http://httpbin.org/get",
    "response": { "status": 200, "on_success": "json_post" }
  },
  {
    "request": "http://httpbin.org/get",
    "response": "This request should not get executed"
  },
  {
    "name": "Form Post",
    "request": {
      "url": "http://httpbin.org/post",
      "method": "POST",
      "form": {
        "message": "But this one does"
      }
    }
  }
]
```

I like JSON-- a lot... but after typing all of those symbols the YAML starts looking nicer and nicer. You can even mix and 
match JSON and YAML within a single script, so you can achieve that perfect blend of short and sweet vs. explicit syntax in 
your recipes...

### Session data
```yaml
request:
  url: http://httpbin.org/post
  method: POST
  form: 
    username: <% username %>
    password: <% password %>
```

Hyperpotamus supports the idea of a session. Sessions are name->value stores that are used to collect and re-use information 
as your script is processed. Notice those `<% .. %>` macros? `<% username %>` means: Take whatever value is stored in the 
session under the key "username" and insert it.

Session data can be passed into hyperpotamus as query-string encoded name/value pairs.

```
hyperpotamus sample.yml --qs "username=pmarkert&password=secret"
```

Session data can also be read in from a .csv file and your script will be executed once for each record in the file.

```
hyperpotamus sample.yml --csv users.csv
```

### Capturing data from the response
In many cases, you want to capture parts of the response either for reporting at the end of your script, or for use in 
subsequent steps. Captured values are stored in the session so that they can be replayed with `<% .. %>` macros.

#### Capturing using regex
```yaml
request: https://github.com/pmarkert/hyperpotamus
response:
  - /latest commit <span.+?>(:<latest_commit>.+?)</span>/
  - emit: Latest commit is <% latest_commit %>
```

[Named captures](https://github.com/cho45/named-regexp.js) allow you to extract data from the web-page by matching content
and extracting data into the session using the capture name as the session key. `(:<group>...)` would save the matched
portion of the response into session so that it can be used as `<% group %>`.  In this example, `<% latest_commit %>` is 
captured from the response.

NOTE: By default, only the first match is captured. Adding the /g option at the end of the regex will cause all instances to 
be captured into an array. (See below for more about arrays and iteration).

#### Capturing with jquery
```yaml
- request: https://www.npmjs.com/package/hyperpotamus
  response:
    - jquery: "ul>li:contains('downloads in the last month') strong"
      capture:
        last_month: text
    - emit: Hyperpotamus has been downloaded <% last_month %> times in the past month.
```

JQuery actions use [selectors](http://api.jquery.com/category/selectors/) to find elements in the HTML.  

Data (attribute values, text content, innerHTML, outerHTML) from the matching elements can be captured into session variables
using the `capture` element. The keys of the capture element are the session keys to which the values will be captured. The 
value of each element can be one of the following:
* text - The textual content of this element and all child elements concatenated together
* @attribute - The value of an HTML attribute, i.e. @href to capture the url for a hyperlink.
* outerHTML - The HTML including the element itself.
* innerHTML - The HTML of all child-nodes for the element.

NOTE: By default only the first item matching the query is captured. If you want to capture all of the elements from the 
page, surround your value target in `[ ]`, like so: `last_month: [ text ]`. This will capture each instance into your session
as an array.

Notice that the response element has an array of actions (`jquery` and `emit` in this case). You can stack together as many
actions as you like; they will be processed in the order they appear. The results of one action are available to all
subsequent actions. 

That `emit` action is used to echo content that can be captured for reporting or display.

### Arrays and iteration

```yaml
- name: setup
  actions:
    set:
      gospels: [ 'Matthew', 'Mark', 'Luke', 'John' ]
- name: print
  actions:
    - emit: The Gospel according to <%@ gospels %>
    - iterate: gospels
      next: print
```

Arrays are useful for many reasons, but they are particularly helpful when you want to repeat a process multiple times. When
you want to use a value from an array, you add the `@` format specifier to your macro, in this example: `<%@ gospels %>`.
This is saying: 'Insert the current value from the array called gospels'. What does it mean when I say 'the current value
from the array'? 

When the `@` format specifier is used, hyperpotamus looks for a second session variable, 'gospels.index' in this case. If
that value does not exist (which is typically the case at first), then a default value of 0 will be assumed and assigned.
Requesting `<%@ gospels %>` will return 
the respective value in the array based upon the current value of `gospels.index`. In this case, it will print out "Matthew",
because that's the first element, at index=0.

If the story ended there, then arrays really wouldn't be very helpful, but fortunately, there's hope! Notice that `iterate`
action? The `iterate` action takes either the name of an array or an array of names of arrays. `iterate` will then increments
the current index for each of them. After incrementing the array index, it will cause the script execution to jump to the
request named in the `next` parameter.  When any of the arrays have been exhausted, meaning that the index reached the end,
then the index is reset and script processing falls through to the rest of the script in normal sequence.

NOTE: If the `next` parameter on an `iterate` action is omitted, then the current step will be repeated. (In this example, we
could have left off the `next: print` and the `name: print` and the effect would have been the same). 

### Conditional branching on success or failure
```yaml
- request: http://httpbin.org/get
  response: 
    status: 200
    on_success: Form Post
- request: http://httpbin.org/get
  response: "This request should not get executed"
- name: Form Post
  request:
    url: http://httpbin.org/post
    method: POST
    form:
      message: "But this one does"
```

If you give your scripting step a name, then other actions can jump to that step. By default, each action supports an
`on_success` or `on_failure` property. Normally if an action succeeds, processing continues to the next step. If the action
fails, then an error is raised and processing stops. By setting the on_success and on_failure value for an action to the name
of another request, the execution flow will jump to that step appropriately.
    
Also, notice the extra parameters for the last request (the method and form elements). 

#### Project Status:
I started working on Hyperpotamus at the beginning of this year to solve some specific issues that I needed to tackle for a
project I was working on. I decided to open-source the project while I am in the process of building it, as opposed to
waiting until I have a stable finalized release.  I mentioned before that API stability and features will be in flux until I
mark the module as a 1.0 release. At that point, I will more strictly adhere to [semantic versioning](http://semver.org). For
now, however, I'm loosely using the minor version number for backwards incompatibilities and the hotfix number for
improvements and additions.

Documentation obviously lags a bit behind the current codebase, until I stabilize things a bit more, so if something doesn't
work for you as expected, there's a good chance it's not your fault.. :) Send me a message or create a github issue.
