const util = require("util");
const CheckerBuilder = require("./CheckerBuilder.js");
const SocketErrorWrapper = require("./SocketErrorWrapper.js");
const BasicSocketError = require("./BasicSocketError.js");
const { ErrorTypes } = require("../../index.js");

class SocketWrapper {
    constructor(socket) {
        this._socket = socket;
    }

    on(event, ...args) {
        if(args.length === 0) {
            throw new ErrorTypes.ProgramError("empty callback");
        }
        this._socket.on(event, this.socket_job_wrapper(event, args));
    }

    socket_job_wrapper(event, funcs) {
        var self = this;
        return async function(...args) {
            try {
                for(var func of funcs) {
                    if(func.name === "CheckerBuilder_checkers") {
                        await func.apply(self, args);
                    } else {
                        await func.apply(func, args);
                    }
                }
            } catch(error) {
                self.process_uncatch_error(error, event, args);
            }
        };
    };

    process_uncatch_error(error, event, args) {
        if(error instanceof BasicSocketError) {
            error.all(args, this);
        } else if(error instanceof ErrorTypes) {
        } else if (error instanceof Error) {
            return new ErrorTypes.ProgramError(error);
        } else if (typeof error === 'string') {
            return new ErrorTypes.ProgramError(error);
        } else {
            new ErrorTypes.ProgramError(`get unknow object ${util.inspect(error)}`);
        }
    }
}

SocketWrapper.error_handler = function(error) {
};

SocketWrapper.process_uncatch_error = function(error) {
};

module.exports = SocketWrapper;