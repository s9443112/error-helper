const log_manager = require('../log-manager.js');
const BasicError = require("../BasicError.js");

class BasicSocketError extends BasicError {
    constructor(options) {
        super(options);
        this.reply_message = options.reply_message;
        this.record_args = options.record_args | false;
        this.reply_event = options.reply_event;
        Error.captureStackTrace(this, BasicSocketError);
    }

    print(socket) {
        if(socket !== undefined) {
            var filename = this.get_caller_file();
            var logger = log_manager.getLogger(`${filename}`);
            logger[this.get_logger_type()](`user ${socket.id} trigger ${this.name}`);
        }
        super.print();
    }

    request_recoder(args) {
        var filename = this.get_caller_file();
        var time_logger = log_manager.getLogger(`${filename}_time`);
        var file_logger = log_manager.getLogger(`${filename}_all`);
        if(!args) {
            return;
        }
        var lines = JSON.stringify(args, null, 2).split('\n');
        file_logger.trace("emit: ");
        for(var index in lines) {
            file_logger.trace(lines[index]);
        }
        file_logger.trace("\n");
    }

    make_response() {
        return {
            status: this.error_code,
            message: this.reply_message,
        };
    }

    all(args, socket) {
        this.print(socket);
        if(this.stack_trace) {
            this.echo_stack_trace();
        }
        if(args) {
            this.request_recoder(args);
        }
        if(socket && this.reply_event) {
            socket.emit(this.reply_event, this.make_response());
        }
    }
}

module.exports = BasicSocketError;
