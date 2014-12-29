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
But enough of that! Let's assume that you already know how awesome it would be if you had the power to automate the www's right at your fingertips...
###Show me the examples

####A super-simple script
----------
    http://www.google.com

####OK, a little bit harder?
    - http://www.google.com
    - http://www.github.com

####So how do I check the response for content?
    request: http://www.nodejs.org
    validation: This simple web server written in Node responds with "Hello World" for every request.

####Regex anyone?
    request: http://www.nodejs.org
    validation: /simple web server/
    
####Conditional branch on success (or failure)
    - request: http://httpbin.org/get
      validation: { status: 200, on_success: json_post }
    - request: http://httpbin.org/get
      validation: "This request should not get executed"
    - name: json_post
      request:
        url: http://httpbin.org/post
        method: POST
        mode: json
        data:
          message: "But this one does"
          
####Of course, JSON is also valid YAML, so if you roll that way, this is equivalent
    [
      {
        "request": "http://httpbin.org/get",
        "validation": { "status": 200, "on_success": "json_post" }
      },
      {
        "request": "http://httpbin.org/get",
        "validation": "This request should not get executed"
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

####Using user-supplied data to login to a website
    request:
      url: http://httpbin.org/post
      method: POST
      mode: form
      data:
        username: <%= username %>
        password: <%= password %>
        
        
"Session" data can be passed into hyperpotamus as a name/value pair object and those values can be inserted into your requests. There are some encoding options to control url encoding/decoding, optional values with defaults, and formatting the current date/time (which can also be used to generate some poor, but effective psuedo-random numbers).

There are still a few features left to be added:
* Capture session data from responses
** using Prefix/Suffix text
** using named Regex captures
** using XPath syntax (for JSON, XML or HTML responses)
* support XPath validations patterns for responses
* Better handling for redirects (auto-follow option)
* Support for cookie containers
* I'm considering adding optional support for Javascript functions for validation/captures
