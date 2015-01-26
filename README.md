# hyperpotamus
YAML based HTTP script processing engine

This README just scratches the surface and gives you enough information to know what hyperpotamus tastes like to either 
get excited or scratch your head and wonder why anyone would be interested. For those who get excited, it is worth 
reading the [Hyperpotamus documentation wiki](http://github.com/pmarkert/hyperpotamus/wiki)

### What does hyperpotamus do?
Hyperpotamus allows you to write simple, human-readable scripts with a text-editor that describe a sequence of web (HTTP/s) requests
and the actions that you want to take to either verify or capture data from the responses. Hyperpotamus scripts support multi-step 
processes where you may need to retrieve content from one web-page to use in a later request. For example, you have to log into a 
website before you can look at your user-profile.

### Why might someone want to do this? 
There are many reasons that I have needed to use such a tool in my own career, including:
* Setting up an automated suite of integration/regression tests for a new web-application
* Creating a monitoring system that checks on a periodic basis to make sure a website or webservice is working
* Stress-testing a web application for performance optimization and tuning
* **Boss:** Hey, we need to get all of these products entered on the customer's website by tomorrow morning, but they don't have any automated API. 
  I need you guys to fill out the 3-page form on their website to submit each one of these 5,000 items? You guys didn't have any plans tonight did 
  you? I'll buy pizza!!

  **Me:** Send me the spreadsheet and give me about 20 minutes... oh, and deep-dish, please.

### Sounds awesome, but do I have to be a ninja to use it?
Well, it depends upon how complicated your scripting needs are. :) You can write some pretty simple scripts in just a few seconds. I've tried
to make it as easy and accessible as possible. In spite of that simplicity, however, there is a lot of power when you are ready to dig deeper. 

Give this quickstart a try. If you can make it through without crying, then you have what it takes. ;) If, on the other hand, you do end up crying, 
don't give up! There's plenty of hope for those who persist. [Romans 5:3-4](https://bible.com/59/rom.5.3-4.esv)

## Quickstart
Enough of that! Let's assume that you already know how awesome it would be if you had the power to automate the www's right at your fingertips.

1. Make sure you have [node.js](http://www.nodejs.org/) installed. (Be sure to include npm as well).
2. Open a command-prompt/shell on your computer and type:
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

What did you just do? You made a script that requests the webpage on the first line and then checks to make sure that the text on the second line 
appears somewhere on the page.

## Some sample scripts, please?
The hyperpotamus YAML syntax attempts to be as simple and fluid as possible. There are lots of syntax shortcuts and sensible defaults-- less is more. 

#### Super-simple script
```yaml
http://www.google.com
```

This script makes a request to the url and makes sure that the page returned an HTTP 200 OK status code. Paste it into a separate text
files, maybe 'super-simple.yml' and run it with `hyperpotamus super-simple.yml --verbose`. If you leave off the `--verbose` options, you
won't see any results (at least not yet), but don't worry, hyperpotamus is still working. Go ahead and try it.

#### OK, a little bit harder?
```yaml
- http://www.google.com
- http://www.github.com
```

This script contains two separate steps. Each step makes a request. If your script only has a single step, then you do not need to 
mark it as an array (with a - in YAML). Hyperpotamus will figure out what you meant. If you want to have multiple requests, you do need to use 
the - syntax to mark where one step ends and another begins.

#### Checking the content of the response
```yaml
request: http://www.nodejs.org
response: This simple web server written in Node responds with "Hello World" for every request.
```

The response element allows you to validate the HTTP response, capture data, or take actions. If your response action is just plain text,
as in this example, it is a shortcut for `text: "..."`.  A text action which will look for exact (case-sensitive) text in the response body.

#### Regex validation
```yaml
request: http://www.nodejs.org
response: /simple web server/i
```

[Regex](http://www.regular-expressions.info/) actions are a shortcut for `{ regex : { pattern : "...", options : ".." } }`. Regex actions also match 
against the response content, but can also contain wild-cards, patterns, captures, and options. In this example the case insensitive option is specified 
with the /i option. To make it cooperate with the YAML parser, if you need to use special characters inside your regex, then your regex can also be 
enclosed in double or single quotes and it will still be treated as a regex as long as it looks like "/regex/options". Valid options are "g", "i", and "m". 

#### Validating HTTP Status codes
```yaml
request: http://httpbin.org/status/404
response: 404
```

Integer actions are a shortcut for `{ status: ... }`. Status actions verify that the HTTP status code from the response matches what you expected. 
If you omit the response element for a step altogether, a default step is automatically added for you to make sure that a 200 OK HTTP status code 
is returned.

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

If you give your scripting step a name, then other actions can jump to that step. By default, each action supports an `on_success` or `on_failure` 
property. Normally if an action succeeds, processing continues to the next step. If the action fails, then an error is raised and processing stops.
By setting the on_success and on_failure value for an action to the name of another request, the execution flow will jump to that step appropriately.
    
Also, notice the extra parameters for the last request (the method and form elements). Hyperpotamus makes use of the 
[request module](https://github.com/request/request), so almost any option supported by [request](https://github.com/request/request) will work. 
This includes custom headers, cookies, posting JSON or Form URL Encoded data, uploading files, and setting up proxy servers.
  
#### JSON scripts
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

I like JSON-- a lot... but after typing all of those symbols the YAML starts looking nicer and nicer. You can even mix and match JSON and YAML within 
a single script, so you can achieve that perfect blend of short and sweet vs. explicit syntax in your recipes...

### Session data
```yaml
request:
  url: http://httpbin.org/post
  method: POST
  form: 
    username: <% username %>
    password: <% password %>
```

Hyperpotamus supports the idea of a session. Sessions are name->value stores that are used to collect and re-use information as your script is processed. 
Notice those `<% .. %>` macros? `<% username %>` means: Take whatever value is stored in the session under the key "username" and insert it.

Session data can be passed into hyperpotamus as query-string encoded name/value pairs.

```
hyperpotamus sample.yml --qs "username=pmarkert&password=secret"
```

Session data can also be read in from a .csv file and your script will be executed once for each record in the file.

```
hyperpotamus sample.yml --csv users.csv
```

### Capturing data from the response
In many cases, you want to capture parts of the response either for reporting at the end of your script, or for use in subsequent steps.
Captured values are stored in the session so that they can be replayed with `<% .. %>` macros.

#### Capturing using regex
```yaml
request: https://github.com/pmarkert/hyperpotamus
response:
  - /latest commit <span.+?>(:<latest_commit>.+?)</span>/
  - emit: Latest commit is <% latest_commit %>
```

[Named captures](https://github.com/cho45/named-regexp.js) allow you to extract data from the web-page by matching content and extracting data 
into the session using the capture name as the session key. `(:<group>...)` would save the matched portion of the response into session so that it
can be used as `<% group %>`.  In this example, `<% latest_commit %>` is captured from the response.

NOTE: By default, only the first match is captured. Adding the /g option at the end of the regex will cause all instances to be captured 
into an array. (See below for more about arrays and iteration).

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

Data (attribute values, text content, innerHTML, outerHTML) from the matching elements can be captured into session variables using the `capture`
element. The keys of the capture element are the session keys to which the values will be captured. The value of each element can be one 
of the following:
* text - The textual content of this element and all child elements concatenated together
* @attribute - The value of an HTML attribute, i.e. @href to capture the url for a hyperlink.
* outerHTML - The HTML including the element itself.
* innerHTML - The HTML of all child-nodes for the element.

NOTE: By default only the first item matching the query is captured. If you want to capture all of the elements from the page, surround your
value target in `[ ]`, like so: `last_month: [ text ]`. This will capture each instance into your session as an array.

Notice that the response element has an array of actions (`jquery` and `emit` in this case). You can stack together as many actions as you like;
they will be processed in the order they appear. The results of one action are available to all subsequent actions. 

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

Arrays are useful for many reasons, but they are particularly helpful when you want to repeat a process multiple times. When you want to use
a value from an array, you add the `@` format specifier to your macro, in this example: `<%@ gospels %>`. This is saying: 'Insert the current 
value from the array called gospels'. What does it mean when I say 'the current value from the array'? 

When the `@` format specifier is used, hyperpotamus looks for a second session variable, 'gospels.index' in this case. If that value does not 
exist (which is typically the case at first), then a default value of 0 will be assumed and assigned. Requesting `<%@ gospels %>` will return 
the respective value in the array based upon the current value of `gospels.index`. In this case, it will print out "Matthew", because that's
the first element, at index=0.

If the story ended there, then arrays really wouldn't be very helpful, but fortunately, there's hope! Notice that `iterate` action? The `iterate` 
action takes either the name of an array or an array of names of arrays. `iterate` will then increments the current index for each of them. After 
incrementing the array index, it will cause the script execution to jump to the request named in the `next` parameter.  When any of the arrays 
have been exhausted, meaning that the index reached the end, then the index is reset and script processing falls through to the rest of the script
in normal sequence.

NOTE: If the `next` parameter on an `iterate` action is omitted, then the current step will be repeated. (In this example, we could have left 
off the `next: print` and the `name: print` and the effect would have been the same). 

#### Project Status:
I started working on Hyperpotamus about 3 weeks ago (2014-12-28) to solve some specific issues that I needed to tackle for my own work. I decided 
to open-source the project while I am in the process of building it, as opposed to waiting until I have a stable finalized release.  I mentioned 
before that API stability and features will be in flux until I mark the module as a 1.0 release. At that point, I will more strictly adhere 
to [semantic versioning](http://semver.org). For now, however, I'm loosely using the minor version number for backwards incompatibilities and the 
hotfix number for improvements and additions. 

Documentation obviously lags a bit behind the current codebase, until I stabilize things a bit more, so if something doesn't work for you as expected, 
there's a good chance it's not your fault.. :) Send me a message or create a github issue.
