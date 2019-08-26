const BasicSocketError = require("./BasicSocketError.js");

/*
  // options default
options = {
    message: "Server has error",
    reply_message: "Server has error",
    error_code: -1,
    level: "trace",
    stack_trace: false,
    reply_message: false,
    record_args: undefined
}
*/

/**
* options
*
*     error_name: error name(string, default: BasicError),
*     message: message of error description (string, default: Server has error),
*     reply_message: message reply to client (string, default: Server has error),
*     error_code: body error code (int, default: -1),
*     level: error level (string ["trace", "debug", "info", "warn", "error", "fatal", "mark"], default: 'trace'),
*     stack_trace: print stack trace (boolean, default: false)
*     reply_message: reply message to socket (boolean, default: false)
*     record_args: record args from client (true: yes, false: no, undefined: if exists, default: undefined)
*
* @param {String} error_name
* @param {Object} options (optional)
* @param {Function} object (optional)
*/

function CreateErrorType(options={}, error_constructor=function(){}) {
    const error_object =  class extends BasicSocketError {
        constructor() {
            super(options);
            this.name = options.error_name | "BasicSocketError";
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

exports.SocketErrorWrapper = require("./SocketErrorWrapper.js");