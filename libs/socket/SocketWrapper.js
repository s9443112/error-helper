const util = require("util");
const CheckerBuilder = require("./CheckerBuilder.js");
const ProgramError = require("./ProgramError.js");
const BasicError = require("./BasicError.js");
const ErrorTypes = require("./ErrorTypes.js");
const { BasicError: BasicHttpError } = require("../../index.js").http;

class SocketWrapper {
    constructor(socket) {
        this._socket = socket;
    }

    emit(...args) {
        this._socket.emit.apply(this._socket, args);
    }

    on(event, ...args) {
        if(args.length === 0) {
            throw new Error("empty callback");
        }
        this._socket.on(event, this.socket_job_wrapper(event, args));
    }

    once(event, ...args) {
        if(args.length === 0) {
            throw new Error("empty callback");
        }
        this._socket.once(event, this.socket_job_wrapper(event, args));
    }

    socket_job_wrapper(event, funcs) {
        var self = this;
        return async function(...args) {
            try {
                for(var func of funcs) {
                    await func.apply(func, args);
                }
            } catch(error) {
                error = self.process_uncatch_error(error, event, args);
                error.all(args, self);
            }
        };
    };

    process_uncatch_error(error, event, args) {
        if(error instanceof BasicError) {
            return error;
        } else if(error instanceof BasicHttpError) {
            return new ErrorTypes.ProgramError(error);
        } else if (error instanceof Error) {
            try {
            return new ErrorTypes.ProgramError(error);
            } catch (error) {
                console.log(error);
                process.exit(1);
            }
        } else if (typeof error === 'string') {
            return new ErrorTypes.ProgramError(error);
        } else {
            return new ErrorTypes.ProgramError(`get unknow object ${util.inspect(error)}`);
        }
    }
}

module.exports = SocketWrapper;
