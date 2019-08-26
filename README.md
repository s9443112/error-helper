# ErrorHelper
automatic error processing

# How To Use It
Go to porject folder

```
npm i --save "https://gitlab+deploy-token-68623:4VjEJwV1j_D2TUV1CRwf@gitlab.com/karta0807913/error-helper.git"
```

# sample code
```
const express = require("express");
const app = express();

const { initLogger, ErrorTypes } = require("error-helper");
initLogger("./src/", "./log", ['log', 'logs']);

app.get("thow_exception", function(req, res) {
    try {
        throw new Error("test error");
    } catch(error) {
        (new ErrorTypes.UncaughtException(error)).all(req, res);
    }
});

const server = http.createServer(app);
```

## function initLogger(path, save_path="./", ignore=[])
call before use
path: scan point
save_path: save logs path
ignore: array, ignore file or folders

## ErrorHandler

### function getFileLogger([filename])
```
// test.js
const { ErrorHandler } = require("error-helper");
ErrorHandler.info("HI"); // save on test.js-YYYY.MM.log
```

### function CreateErrorType(options={}, error_constructor=function() {})
default options
const options = {
    error_name: "BasicError",
    message: "Server has error",
    reply_message: "Server has error", 
    error_status: 403, 
    error_code: 0,
    level: "trace",
    stack_trace: false,
};

error_name: error name
message: display message for developer
reply_message: display message for user
error_status: http status
error_code: user error code
level: error level
stack_trace: record stacks or not

## BasicError

### function all([req, res])
do everything
if req, record req.body
if res, return head and end

### function get_logger_type()
return error type, default options.level

### function make_response()
return response, default:
```
{
    status: options.error_code,
    message: options.reply_message,
}
```

### function get_stack_info()
return error stack, default this.stack

### function get_caller_file([ignore_filename])
return error caller filename

### function echo_stack_trace()
print stack trace on screen and file

### function print()
print error and message on sreen and file

### function toString()
return print() string

### function inspect()
return mesage and stack string
example
```
ProgramError: test error
	errorFunction (error-helper/test/wrap_error_test.js:5)
	catchErrorFunction (error-helper/test/wrap_error_test.js:10)
	error-helper/test/wrap_error_test.js:20
	listOnTimeout (timers.js:327)
	processTimers (timers.js:271)
```

### function request_recoder(request)
print request.body to file

### function get_head()
return response header

## function ErrorTypeHelper (error_name, [options, object])
create error type
example
```
const { ErrorTypeHelper, ErrorTypes } = require("error-helper");
var testError = ErrorTypeHelper("TestError", {
    level: "error",
    stack_trace: false,
    error_status: 412,
    error_code: -120,
    message: "this is a test",
    reply_message: "test success"
}, function() {
    this.print = function() {
        console.log("HI");
    }   
});

console.log(testError === ErrorTypes.TestError); // true
```


## ErrorTypes

### class ProgramError (error)
a error wrapper
```
options = {                                   
    level: "fatal",                                                 
    stack_trace: true,                                              
    error_status: 500,                                              
    error_code: 0                                                   
}

get_stack_info() {                             
    return this.error.stack;                                             
};
```

### class MiddlewareError (reply_message)
middleware error
```
options = {                                
    level: "info",                                                  
    stack_trace: false,                                             
    error_status: 403,                                              
    error_code: -1,                                                 
}
```

### class UncaughtException (error)
fatal error wrapper 
```
options = {
    level: "fatal",
    stack_trace: true,
    error_status: 500
}

get_stack_info() {                             
    return this.error.stack;                                             
};
```
## CheckerBuilder
a middleware for express

### class CheckerBuilder (check_functions=[])
check_function example
```
const { ErrorTypeHelper, ErrorTypes, initLogger, CheckerBuilder } = require("error-helper");
const verifyError = new ErrorTypes.VerifyError("Test Error");
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

function check_function(req) {
    if(req.headers["test"] !== "GOOD") {
        return verifyError;
    }
    req.body = "test body recored";
}

middleware = new CheckerBuilder.CheckerBuilder([
    check_function
]).create_middleware_checker();

app.use(middleware);

app.use(function(req, res) {
    res.end("Passed");
});
```
