# hyperpotamus

YAML based HTTP script processing engine

Hyperpotamus is a node.js library that enables you to automate sending HTTP requests and to verify/capture data in the responses. Hyperpotamus scripts are written as simple YAML files. 

Why might someone want to do this? There are many reasons that I have needed to use such a tool in my own career, including:
* Setting up an automated suite of integration/regression tests for your new web-application
* Creating a monitoring system that checks to make sure your website is working on a periodic basis
* Stress-testing a web application for performance optimization and tuning
* **Boss:** Hey, we need to get all of these products entered on the customer's website by tomorrow morning, but they don't have any automated API. I need you guys to fill out the 3-page form on their website to submit each one of these 5,000 items? I'll buy the pizza!

  **Me:** Give me the spreadsheet and about 20 minutes... and deep-dish, please.

-----
Enough of that! Let's assume that you already know how awesome it would be if you had the power to automate the www's right at your fingertips.

The hyperpotamus YAML syntax attempts to be as fluid as possible. I.e. there are lots of syntax shortcuts and sensible defaults- less is more. 

###Show me the examples

####A super-simple script
----------
    http://www.google.com

####OK, a little bit harder?
    - http://www.google.com
    - http://www.github.com

####How do I check the response for content?
    request: http://www.nodejs.org
    response: This simple web server written in Node responds with "Hello World" for every request.

The response section allows you to validate the HTTP response. String values are a shortcut for { text : "..." } which will look for that exact text (case-sensitive) in the response body.

####Regex anyone?
    request: http://www.nodejs.org
    response: /simple web server/

Regex validations are a shortcut for { regex : "...", options : ".." } and also match against the response content. The regex can also be enclosed in 
double or single quotes (like "/regex/g") if there are special characters that would invalidate the YAML.

####Validate HTTP Status codes
    request: http://httpbin.org/redirect/1
    response: 302 

Integer validations are a shortcut for { status: ... } and match against the HTTP status code.

####Conditional branching on validation success (or failure)
    - request: http://httpbin.org/get
      resposne: { status: 200, on_success: json_post }
    - request: http://httpbin.org/get
      response: "This request should not get executed"
    - name: json_post
      request:
        url: http://httpbin.org/post
        method: POST
        mode: json
        data:
          message: "But this one does"

Give your requests a name and you can specify an on_success or on_failure value for any validation.
    
####Of course, JSON is also valid YAML, so if you roll that way, this is equivalent
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
        "name": "json_post",
        "request": {
          "url": "http://httpbin.org/post",
          "method": "POST",
          "mode": "json",
          "data": {
            "message": "But this one does"
          }
        }
      }
    ]

####Setting HTTP headers
    request: 
     url: http://httpbin.org/get
     headers: 
       user-agent: Mozilla/5.0 (Hyperpotamus; FTW!) 
       custom-header: show off

####POSTing user-supplied data to a login form
    request:
      url: http://httpbin.org/post
      method: POST
      mode: form
      data: 
        username: <%= username %>
        password: <%= password %>

"Session" data can be passed into hyperpotamus as a name/value pair object and those values can be inserted into your requests with replacement tokens. 

####POST w/Form encoded values (equivalent)
    request:
      url: http://httpbin.org/post
      method: POST
      mode: form
      data: username=<%+ username %>&password=<%+ password %>

There are options to control url encoding(+)/decoding(-) for replacement tokens. Notice the <%+ ... %> vs <%= %>. Multi-level encoding/decoding can also be done (+++)/(--).

####Optional replacement tokens with default values
    request: http://httpbin.org/get?param=<%?+ search|cat videos %>

Normally if a replacement token can't be found, it reports an error.  The ? control directive makes it optional and a |default 
provides the value if no session value is found (otherwise it's blank). In this example it's also url-encoded for use in the url.

###Capturing data from the response
In many cases, you want to capture parts of the response either for reporting at the end of your script, or for use in subsequent steps.

####Capturing using regex
    request: http://httpbin.org/get?favorite_verse=<%+ favorite_verse %>
    response: /"X-Request-Id"\s*:\s*"(:<request_id>.+?)"/

Named captures (:<group>...) in a regular expression are added to the session object for use in future replacements. In this example, 
<%= request_id %> is captured from the json response.

####Validating/capturing from HTTP headers
    request: http://localhost:3000/get?url=medium
    response: 
      - headers:
          content-type: /(:<content_type>[^;]*)/
      - equals: [ "application/json", "<%= content_type %>" ]

Here the response element is an array of two items. You can have as many different validations mixed together as you like.
* The headers validation element has name/value pairs to compare to HTTP response headers.  The right hand side can either be a string or a regex 
(with capturing groups if desired).
* The equals validation element is an array of strings that after interpolation of any variables, should all be the same.
          
####Capturing with jquery
    request: http://httpbin.org/
    response: 
      jquery: "div.mp ul:first a"
      count: 32
      capture:
        href: "@href"
        text: text
        innerHTML: innerHTML
        outerHTML: outerHTML
        all_hrefs: [ "@href" ]
        all_html: [ outerHTML ]

JQuery validation uses [selectors|http://api.jquery.com/category/selectors/] to find elements on the page. The optional count property can be used to 
validate that the number of elements matched by the selector fits the expectation. Once a list of elements is obtained, various attributes, text, 
innerHTML, outerHTML, etc. can be captured from the matching nodes. If the capture target is in an array then the values from all matching elements 
will be added to the session as an array. If the target is not inside an array, then only the last matching item will be captured. 

##Getting started
hyperpotamus can be used as a library in your node.js applications. 

    var hyp = require("hyperpotamus")
    hyp.yaml.process_file("/path/to/file.yml", { session : "data" }, script_complete, step_complete);

    function script_complete(err, final_session) {
      if(err) { return console.log("Error - " + err); };
      console.log("Final session state is " + JSON.stringify(final_session));
    }
 
    function step_complete(step, session, http_response, body) {
      console.log("Completed request for " + step.request.url);
    }

The intention is that the library can be used on a timer (maybe for monitoring), in a loop (for processing session data from a csv file), 
or called multiple times asynchronously (for stress testing).

##CLI interface
There is also a sample command-line interface that can be used to test out your scripts or do some basic web-scraping, but it isn't quite ready 
for prime-time yet. To use it

    hyperpotamus /path/to/script.yml "url encoded session values" "output format string"


The url encoded session values should be in the format of a querystring i.e. key1=value1&key2=value2. (NOTE: Put this in quotes if you don't want the 
& to be interpreted by your shell.) 

If you leave off the "output format string", then you will see some diagnostic information about the requests and responses from your script. 
If you do specify an output format string then the only output will be the result of your format string interpolated with the final session values 
at the end of the script. You can use this to store and record scraped values.

    hyperpotamus capturing_data_from_the_response.yml "favorite_verse=Colossians%203%3a23" "Request_Id is <%=request_id%>"

##Todo
There are still a few features left to be added:
* Capture/validate using XPath against JSON responses
* Better handling for redirects (auto-follow option)
* Testing and support for cookie containers
* Configurable support for Javascript functions for validation/captures
