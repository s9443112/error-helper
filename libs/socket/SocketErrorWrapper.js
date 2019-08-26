const log_manager = require('../log-manager.js');
const SocketWrapper = require("./SocketWrapper.js");
const { BasicError, ErrorTypes } = require("../../index.js");

class SocketErrorWrapper extends require("./BasicSocketError.js") {
    constructor(error) {
        if(error instanceof Error) {
            error = new ErrorTypes.ProgramError(error);
        }
        super({
            message: error.message,
            reply_message: error.reply_message,
            error_code: error.error_code,
            error_status: error.error_status,
            level: error.level,
            stack_trace: error.stack_trace,
        });
        this.error_name = this.name;
        Error.captureStackTrace(this, SocketErrorWrapper);
        this.error = error;
    }

    get_stack_info() {
        return this.error.get_stack_info();
    }

    print(socket) {
        super.print(socket);
        this.error.print();
    }

    echo_stack_trace() {
        this.error.echo_stack_trace();
    }

    inspect() {
        return this.error.inspect();
    }
}

module.exports = SocketErrorWrapper;