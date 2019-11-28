const fs = require('fs');
const path = require('path');
const log_manager = require('./log-manager.js');

const options = {
    error_name: "BasicError",
    message: "Server has error",
    reply_message: "Server has error",
    level: "trace",
    stack_trace: false,
};

function default_option(obj, m_options={}) {
    for(var key in options) {
        obj[key] = obj[key] || m_options[key] || options[key];
    }
};


const level = new Set(["trace", "debug", "info", "warn", "error", "fatal", "mark"]);

class BasicError extends Error {
    constructor(options) {
        super();
        Error.captureStackTrace(this, BasicError);
        default_option(this, options);
    }

    get_logger_type() {
        return (level.has(this.level)) ? this.level : "trace";
    }

    make_response() {
        return JSON.stringify({
            status: this.error_code,
            message: this.reply_message,
        });
    }

    get_stack_info() {
        var stack = this.stack;
        return this._stack_info;
    }

    inspect() {
        var stacks = this.get_stack_info();
        var return_string = `${this.error_name}: ${this.message}\n`;
        for (var stack of stacks) {
            if(stack.functionName) {
                return_string += `   at: ${stack.functionName} (${stack.fileName}:${stack.lineNumber})\n`;
            } else {
                return_string += `   at: ${stack.fileName}:${stack.lineNumber}\n`;
            }
        }
        return return_string;
    }

    get_caller_file(ignore_name=undefined) {
        var caller_file = "default";
        var ignore_list = [ path.basename(__filename) ];
        ignore_name && ignore_list.push(path.basename(ignore_name));

        try {
            for(var stack of this.get_stack_info()) {
                if(!stack.fileName) {
                    continue;
                }
                var filename = path.basename(stack.fileName);
                if (!ignore_list.includes(filename)) {
                    caller_file = filename;
                    break;
                }
            }
        } catch (e) {
            console.trace(e);
        }
        return caller_file;
    }

    echo_stack_trace() {
        var filename = this.get_caller_file();
        var logger = log_manager.getLogger(`${filename}_stack`);
        for (var stack of this.get_stack_info()) {
            if(stack.functionName) {
                logger.trace(`${stack.functionName} (${stack.fileName}:${stack.lineNumber})`);
            } else {
                logger.trace(`${stack.fileName}: ${stack.lineNumber}`);
            }
        }
        logger.trace("");
    }

    print() {
        var filename = this.get_caller_file();
        var logger = log_manager.getLogger(filename);
        logger[this.get_logger_type()](`${this.error_name}: ${this.message}`);;
    }

    toString() {
        var stack = this.get_stack_info();
        return `${this.error_name}: ${this.message}`;
    }

    all() {
        this.print();
        if(this.stack_trace) {
            this.echo_stack_trace();
        }
    }
}
module.exports = BasicError;