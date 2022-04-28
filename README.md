[![downloads](https://img.shields.io/npm/dt/hyperpotamus.svg)](https://www.npmjs.com/package/hyperpotamus)
[![latest version](https://img.shields.io/npm/v/hyperpotamus.svg)](https://www.npmjs.com/package/hyperpotamus)
[![build status](https://img.shields.io/travis/pmarkert/hyperpotamus/master.svg)](https://travis-ci.com/pmarkert/hyperpotamus)
[![license](https://img.shields.io/npm/l/hyperpotamus.svg)](https://github.com/pmarkert/hyperpotamus/blob/master/LICENSE)
[![chat](https://badges.gitter.im/hyperpotamus_js/general.svg)](https://gitter.im/hyperpotamus_js/general)

![Hyperpotamus](images/hyperpotamus_logo.png)

# hyperpotamus
"...its like duct tape for programming the web."

Hyperpotamus n. [hyper·pot·a·mus] - A YAML based scripting language for processing data, automating the web, and doing ... stuff.


### Example script
```YAML
# Ask the user for a size
- prompt:
    pizza_size: "What size pizza do you want? [small, medium, or large]"

- request: # Send a request to httpbin.org with our pizza order
    url: http://httpbin.org/post
    method: POST
    json:
      size: <% pizza_size %>
      crust: deep-dish
      toppings: [ pepperoni, extra-cheese ]
  response:
    - json: # Capture the IP address from the response
       ip_address: "$.origin" 
    - print: "Your order was placed from IP Address- <% ip_address %>"
```

This README just scratches the surface to give you enough information to know what hyperpotamus tastes like and either
get excited or scratch your head and wonder why anyone would be interested. For those who get excited, it is worth 
reading the [Hyperpotamus documentation wiki](http://github.com/pmarkert/hyperpotamus/wiki)

### What does hyperpotamus do?
Hyperpotamus allows you to write simple, human-readable scripts using any text-editor to describe a sequence of web requests (HTTP/HTTPS) and actions that you want to take to verify or capture data from the responses. Hyperpotamus scripts support multi-step processes where information can be retrieved from the results of one request to print out or use in subsequent requests. For example, you may need to retrieve a listing of photos from one page before you select one or all of them to download on a second page. Hyperpotamus uses powerful dynamic macros to customize parameters in the web-requests. The values for these macros can be passed in on the command-line, read from a spreadsheet, loaded from a JSON/YAML data-file, captured from a previous request, or read in from the user running the script at a prompt.

### Why might someone want to do this?
There are many reasons that I have needed to use such a tool in my own career, including:
* Invoking a JSON-based API to send requests, retrieve data and submit updates
* Creating a monitoring system that checks urls or APIs a regular basis to make sure a website or service is working
* Screen-scraping HTML to retrieve documents and/or data
* Setting up an automated suite of integration/regression tests for a new web-application or API
* Stress-testing a web application for performance optimization and tuning
* **Boss (7:30pm):** Hey! We need to get all the products on this spreadsheet entered on the customer's website before 6:00am tomorrow morning, but it's taking our team of 5 people *forever* to fill out the 3-page form on their website to copy/paste the fields for each row to submit each of these 8,000 items! We really need you to jump in and help us with the click/copy/paste/submit party, the team is desperate! You didn't have any plans for tonight did you? I'll buy pizza!!

  **You:** Sure -- I'm happy to help! Send me the spreadsheet and a link to the website. Then give me about 20 minutes to finish entering all of the products... oh, and deep-dish, please. Can I order it "to-go"?

### OK, sounds amazing, do I have to be a ninja to use it?
No, anyone can write simple scripts in just a few seconds. Once you get started, it's a process of learning how to combine the proper actions, pipes, and macros to build more powerful and robust scripts. Hyperpotamus scripting was designed to be easy and accessible, however, in spite of that simplicity, there is plenty of power when you are ready to dig deeper. And if that's not enough, you can even extend and bend hyperpotamus to do your will by writing custom plugins.

When you are ready to become a ninja, checkout the [hyperpotamus dojo](https://github.com/pmarkert/hyperpotamus/wiki/dojo).

## Quickstart
Assuming you already know how awesome it would be if you had the power to automate the www's right at your fingertips. Let's get started.

1. Make sure you have [node.js](http://www.nodejs.org/) and npm installed. The current version can be found here: [https://nodejs.org/en/download/current/](https://nodejs.org/en/download/current/)

2. Now to install hyperpotamus: Open a command-prompt/terminal on your computer and type:
 ```
 npm install -g hyperpotamus
 ```
 NOTE: If you get an access deined error, this may mean that you have node.js installed improperly. You can always use adminsitrator/sudo access to install it, but consider Here are instructions to fix this:you may get an error are on a Mac (or linux), you will want to use `sudo` for administrator permissions.
 ```
 sudo npm install -g hyperpotamus
 ```

3. Create a text-file called "first.yml" with the following contents:

 ```yaml
 - print: "Hello World"
 ```

4. Execute your script by running it with hyperpotamus:
 ```
 hyperpotamus first.yml
 ```

If everything worked, then you should see "Hello World" printed to the console. Pretty anti-climatic. I know, right? Now let's use some variables and dynamic macros.

## Going deeper
### Parameterizing the script
Edit your script as follows:
```yaml
- defaults:
    first_name: Mr.
    last_name: Roboto

- print: "Hello <% first_name %> <% last_name %>!"
```

In this version, we set some default values for session variables and then we use `<% macros %>` to dynamically insert the values where needed.

Now when you run the script, is replaces the macros with the appropriate session variables.

```
Hello Mr. Roboto!
```

### Batch operations using .csv input
What if we wanted to send a greeting to all of our customers? We could create a .csv data file with our customer data like so:
```
first_name,last_name,hair_color
Phillip,Markert,none
someone,else,unknown
```

and then we can run it with the `--csv` parameter to tell it to use our data file:
```
hyperpotamus script.yml --csv customers.csv
```

This time hyperpotamus gives us the following output:
```
Hello Phillip Markert!
Hello someone else!
```

Notice that hyperpotamus ran the script once for each line in the spreadsheet and made the column values available as session variables that can be used with macros.

If you run the script again adding a few verbose flags (-v or -vv or -vvv) you will see more information about what hyperpotamus is doing. The more v's you add, the more output you get.

### Other sources of data
Session variables can come from a variety of sources:
* Using the `defaults` or `set` actions to store a specific value.
* Using the `--csv` option to read rows from a spreadsheet
* Using the `prompt` to ask the user users for a value
* Using the `--data` option to read JSON or YAML files.
* By capturing data from the response of a web request using
    * JsonPath (for JSON)
    * XPath (for XML)
    * JQuery (for HTML)
    * Regex (for text)
* By capturing the output from another process

### Submitting data to an API
What if we wanted to submit each of those greetings to a hypothetical web API?
```yaml
- request:
    url: http://httpbin.org/post
    method: POST
    form:
       customer_first_name: <% first_name %>
       customer_last_name: <% last_name %>
       customer_hair_color: <% hair_color %>
```

### Customizing requests
If you want to get fancier with your requests, you can customize them. Hyperpotamus makes use of the excellent [request module](https://github.com/request/request), so any option supported by [request](https://github.com/request/request) should work with hyperpotamus as well.

Some common customizations you may want to use include:

* modifying the HTTP method 
* modifying standard headers like user-agent, accept-language, cache-control, cookies, etc.
* setting authentication data (basic auth, bearer tokens, digest, or others.)
* setting custom headers
* submitting JSON, Form URL Encoded data, or multi-part file uploads
* requesting through proxy servers
* disabling automatic redirect following

The example at the top of this README in the intro section demonstrates a few of these options.

### Checking the content of the response
Sending requests with hyperpotamus is really only part of the story. Hyperpotamus also allows you to check or capture parts of the response as well.

```YAML
request: "http://www.nodejs.org"
response:
  text: This simple web server written in Node responds with "Hello World" for every request.
```

The response configuration allows you to handle the HTTP response to validate, capture data, or take other actions.

A text action which will look for the exact (case-sensitive) text in the response body. If the text is not found, an error is raised. If the text is found, then the script continues processing.

#### Validating HTTP Status codes
```yaml
request: http://httpbin.org/status/404
response: 
 - status: 404
```

Status actions verify that the HTTP status code from the response matches what you expected. As a shortcut for a status 
action, you can just supply the status code as an integer. 

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
    - emit: The Gospel according to <% gospels | current %>
    - iterate: gospels
      next: print
```

Arrays are useful for many reasons, but they are particularly helpful when you want to repeat a process multiple times. When
you want to use a value from an array, you add the `current` pipe to your macro, in this example: `<% gospels | current %>`.
This is saying: 'Insert the current value from the array called gospels'. What does it mean when I say 'the current value
from the array'? 

When the `current` pipe is used, hyperpotamus looks for a second session variable, 'gospels.index' in this case. If
that value does not exist (which is typically the case at first), then a default value of 0 will be assumed and assigned.
Requesting `<% gospels | current %>` will return 
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
