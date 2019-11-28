const BasicError = require("./BasicError.js");

/*
  // options default
options = {
    message: "Server has error",
    reply_message: "Server has error",
    error_code: -1,
    level: "trace",
    stack_trace: false,
    reply_message: undefined,
    record_args: undefined,
}
*/

/**
* options
*
*     error_name: error name(string, default: BasicError),
*     message: message of error description (string, default: Server has error),
*     reply_event: reply event to socket, if undefined will not push (string, default: undefined)
*     reply_message: reply message to socket (string, defaul: undefuned)
*     error_code: body error code (int, default: -1),
*     level: error level (string ["trace", "debug", "info", "warn", "error", "fatal", "mark"], default: 'trace'),
*     stack_trace: print stack trace (boolean, default: false)
*     record_args: record args from client (true: if exists, false: no, default: false)
*
* @param {String} error_name
* @param {Object} options (optional)
* @param {Function} object (optional)
*/

function CreateErrorType(options={}, error_constructor=function(){}) {
    const error_object =  class extends BasicError {
        constructor() {
            super(options);
            this.name = options.error_name || "BasicSocketError";
            Error.captureStackTrace(this, error_object);
            error_constructor.apply(this, arguments);
        }
    };
    return error_object;
};

function ErrorTypeHelper(error_name, options, object = function () { }) {
    object = CreateErrorType(options, object);
    options.error_name = error_name;
    exports[error_name] = object;
    return object;
}

ErrorTypeHelper("ProgramError", {
    reply_message: "Socket has error",
    error_code: -1,
    level: "fatal",
    stack_trace: true,
    reply_message: "Socket has error",
    record_args: true
}, function(error) {
    if (error instanceof Error) {
        this.error = error;
        this.message = error.message;
        this.get_stack_info = function () {
            var stack = this.error.stack;
            return this.error._stack_info;
        };
    } else if (typeof error === 'string'){
        this.message = error;
    }
});

ErrorTypeHelper("MiddlewareError", {
    level: "info",
    stack_trace: false,
    error_code: -2
}, function(message, reply_message=message, reply_event=undefined) {
    this.message = message;
    this.reply_message = reply_message;
    this.reply_event = reply_event;
});

ErrorTypeHelper("VerifyError", {
    level: "error",
    stack_trace: false,
    error_code: -3,
}, function (message, reply_message = message, reply_event=undefined) {
    this.message = message;
    this.reply_message = reply_message;
    this.reply_event = reply_event;
});

exports.ProgramError = require("./ProgramError.js");
exports.ErrorTypeHelper = ErrorTypeHelper;
