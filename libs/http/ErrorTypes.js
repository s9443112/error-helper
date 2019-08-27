const BasicHttpError = require('./BasicHttpError.js');

/*
  // options default
options = {
    message: "Server has error",
    reply_message: "Server has error",
    error_status: 403,
    error_code: -1,
    level: "trace",
    stack_trace: false
}
*/

/**
* options
*
*     error_name: error name(string, default: BasicError),
*     message: message of error description (string, default: Server has error),
*     reply_message: message reply to client (string, default: Server has error),
*     error_status: http error code (int, default: 403),
*     error_code: body error code (int, default: -1),
*     level: error level (string ["trace", "debug", "info", "warn", "error", "fatal", "mark"], default: 'trace'),
*     stack_trace: print stack trace (boolean, default: false)
*
* @param {String} error_name
* @param {Object} options (optional)
* @param {Function} object (optional)
*/

function CreateErrorType(options={}, error_constructor=function(){}) {
    const error_object =  class extends BasicHttpError {
        constructor() {
            super(options);
            this.name = options.error_name | "BasicHttpError";
            Error.captureStackTrace(this, error_object);
            error_constructor.apply(this, arguments);
        }
    };
    return error_object;
};

function ErrorTypeHelper(error_name, options, object = function () { }) {
    object = CreateErrorType(options, object);
    object.prototype.error_name = error_name;
    exports[error_name] = object;
    return object;
}

// ErrorTypeHelper("TestError");

ErrorTypeHelper("ProgramError", {
    level: "fatal",
    stack_trace: true,
    error_status: 500,
    error_code: 0
}, function (error) {
    if (error instanceof Error) {
        this.error = error;
        this.message = error.message;
        this.get_stack_info = function () {
            return this.error.stack;
        };
    } else if (typeof error === 'string'){
        this.message = error;
    }
});

ErrorTypeHelper("MiddlewareError", {
    level: "info",
    stack_trace: false,
    error_status: 403,
    error_code: -1,
}, function (error_message) {
    this.message = error_message;
    this.reply_message = this.message;
});

ErrorTypeHelper("VerifyError", {
    level: "error",
    stack_trace: false,
    error_status: 403,
    error_code: -2,
}, function (message, reply_message = message) {
    this.message = message;
    this.reply_message = reply_message;
});

ErrorTypeHelper("UncaughtException", {
    level: "fatal",
    stack_trace: true,
    error_status: 500
}, function (error) {
    this.error = error;
    this.message = error.message;
    this.get_stack_info = function () {
        return this.error.stack;
    };
});

exports.ErrorTypeHelper = ErrorTypeHelper;

