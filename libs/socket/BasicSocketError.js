const log_manager = require('../log-manager.js');
const BasicError = require("../BasicError.js");

class BasicSocketError extends BasicError {
    constructor(options) {
        super(options);
        this.reply_message = options.reply_message;
        Error.captureStackTrace(this, BasicSocketError);
    }

    print(socket) {
        var filename = this.get_caller_file();
        var logger = log_manager.getLogger(`${filename}`);
        if(socket !== undefined) {
            logger[this.get_logger_type()](`user ${socket.id} trigger ${this.error.name}`);
        }
    }

    request_recoder(args) {
        var filename = this.get_caller_file();
        var time_logger = log_manager.getLogger(`${filename}_time`);
        var file_logger = log_manager.getLogger(`${filename}_all`);
        time_logger[this.get_logger_type()](`User emit ${args[0]}`);
        if(!args) {
            return;
        }
        var lines = JSON.stringify(args, null, 2).split('\n');
        file_logger.trace("body: ");
        for(var index in lines) {
            file_logger.trace(lines[index]);
        }
        file_logger.trace("\n");
    }

    all(args, socket) {
        this.print(socket);
        if(this.stack_trace) {
            this.echo_stack_trace();
        }
        if(args) {
            this.request_recoder(args);
        }
        if(socket) {
            socket.emit(this.make_response());
        }
    }
}

module.exports = BasicSocketError;