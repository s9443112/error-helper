var fs = require('fs');
var path = require('path');
var http = require("http");
var log_manager = require('./log-manager.js');
var trace_logger_name = "stack_trace";

const options = {
    error_name: "BasicError",
    message: "Server has error",
    reply_message: "Server has error",
    error_status: 403,
    error_code: 0,
    level: "trace",
    stack_trace: false,
};
exports.options = options;

const level = new Set(["trace", "debug", "info", "warn", "error", "fatal", "mark"]);
exports.level = level;

exports.default_option = function(obj, options={}) {
    for(var key in exports.options) {
        obj[key] = obj[key] || options[key] || exports.options[key];
    }
};

class BasicError extends Error {
    constructor(options) {
        super();
        Error.captureStackTrace(this, BasicError);
        exports.default_option(this, options);
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
        if(this._x === undefined) {
            this._x = this.stack;
        }
        return this._x;
        // return "HI"; //[this.error_name + ": " + this.message].concat(this.stack);
    }

    inspect() {
        var stacks = this.get_stack_info().stack;
        var return_string = `${this.error_name}: ${this.message}\n`;
        for (var stack of stacks) {
            if(stack.functionName) {
                return_string += `\t${stack.functionName} (${stack.fileName}:${stack.lineNumber})\n`
            } else {
                return_string += `\t${stack.fileName}:${stack.lineNumber}\n`
            }
        }
        return return_string;
    }

    get_caller_file(ignore_name=undefined) {
        var caller_file = "default";
        var ignore_list = [ path.basename(__filename) ];
        ignore_name && ignore_list.push(path.basename(ignore_name));

        try {
            for(var stack of this.get_stack_info().stack) {
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
        for (var stack of this.get_stack_info().stack) {
            if(stack.functionName) {
                logger.trace(`${stack.functionName} (${stack.fileName}:${stack.lineNumber})`);
            } else {
                logger.trace(`${stack.fileName}:${stack.lineNumber}`);
            }
        }
        for(var i = 0; i < stack.length; ++i) {
            logger.trace(stack[i].getFileName());
        }
        logger.trace("");
    }

    print() {
        var filename = this.get_caller_file();
        var logger = log_manager.getLogger(`${filename}`);
        logger[this.get_logger_type()](`${this.error_name}: ${this.message}`);;
    }

    toString() {
        var stack = this.get_stack_info().stack;
        return `${this.error_name}: ${this.message}`;
    }

    request_recoder(request) {
        var filename = this.get_caller_file();
        var time_logger = log_manager.getLogger(`${filename}_time`);
        var file_logger = log_manager.getLogger(`${filename}_all`);
        time_logger[this.get_logger_type()](`${request.method} ${request.originalUrl || request.url}`);
        if(!request.body) {
            return;
        }
        var lines = JSON.stringify(request.body, null, 2).split('\n');
        file_logger.trace("body: ");
        for(var index in lines) {
            file_logger.trace(lines[index]);
        }
        file_logger.trace("\n");
    }

    get_head() {
        return {
            "Content-Type": "application/json"
        }
    }

    all(req, res) {
        this.print();
        if(this.stack_trace) {
            this.echo_stack_trace();
        }
        if(arguments.length === 0) {
            return this.make_response();
        }

        if(arguments.length === 2) {
            if(res instanceof http.IncomingMessage && req instanceof http.ServerResponse) { // swap
                req, res = [res, req];
            }
            this.request_recoder(req);
            res.writeHead(this.error_status, this.get_head());
            res.end(this.make_response());
            return;
        } else if(arguments.length === 1) {
            if(req instanceof http.IncomingMessage) {
                this.request_recoder(req);
            } else if(req instanceof http.ServerResponse) {
                res = req;
                res.writeHead(this.error_status, {
                    "Content-Type": "application/json"
                });
                res.end(this.make_response());
            }
            return;
        }
        return this.make_response();
    }
}

function registFileLogger(log_name, path) {
    console.log(`setting log file ${log_name} on ${path}`);
    log_manager.registAppenders(`${log_name}_time`,  {
        type: 'dateFile',
        filename: path,
        pattern: '-yyyy-MM.log',
        alwaysIncludePattern: true,
        layout: {
            type: 'pattern',
            pattern: '[%d] %p: %m'
        }
    });

    log_manager.registAppenders(`${log_name}_all`, {
        type: 'dateFile',
        filename: path,
        pattern: '-yyyy-MM.log',
        alwaysIncludePattern: true,
        layout: {
            type: 'pattern',
            pattern: '[%p]: %m'
        }
    });

    // log_manager.registAppenders(`${log_name}_stack`, {
    //     type: 'dateFile',
    //     filename: path,
    //     pattern: '-yyyy-MM.log',
    //     alwaysIncludePattern: true,
    //     layout: {
    //         type: 'pattern',
    //         pattern: '[%c] STACK: %m'
    //     }
    // });

    log_manager.registAppenders(`${log_name}_console_record`, {
        type: 'console',
        layout: {
            type: 'pattern',
            pattern: '%[%d [%p] %m%]'
        }
    });

    log_manager.registAppenders(`_${log_name}_file_record`, {
        type: 'dateFile',
        filename: path,
        pattern: '-yyyy-MM.log',
        alwaysIncludePattern: true,
        layout: {
            type: 'pattern',
            pattern: '%d [%p] %m'
        }
    });

    log_manager.registAppenders(`${log_name}_file_record`, {
        type: 'logLevelFilter',
        appender: `_${log_name}_file_record`,
        level: 'error'
    });

    // -------------
    log_manager.registCategory(`${log_name}_time`, {
        appenders: [`${log_name}_time`],
        level: 'all'
    });

    log_manager.registCategory(`${log_name}_all`, {
        appenders: [`${log_name}_all`],
        level: 'all'
    });

    log_manager.registCategory(`${log_name}_stack`, {
        appenders: [trace_logger_name, `${log_name}_all`],
        level: 'all'
    });

    log_manager.registCategory(log_name, {
        appenders: [`${log_name}_file_record`, `${log_name}_console_record`, `log_common_collection`],
        level: 'all'
    });

}

function iter_floders (basic_path, iter_path, save_path, ignore) {
    var fullpath = path.join(basic_path, iter_path);
    return function(err, files) {
        if(err) {
            console.log(err);
            return;
        }
        files.forEach(function(file) {
            var joinpath = path.join(fullpath, file);
            fs.stat(joinpath , function( error, stat ) {
                if(error) {
                    console.log(error);
                    return;
                }
                if(ignore.has(file)) {
                    return;
                }
                if(stat.isFile()) {
                    registFileLogger(file, path.join(save_path, path.join(iter_path, file)));
                } else {
                    fs.readdir(joinpath, iter_floders(basic_path, path.join(iter_path, file), save_path, ignore));
                }
            });
        });
    };
}

exports.getFileLogger = function(filename) {
    filename = (filename && path.basename(filename)) || new BasicError().get_caller_file();
    return log_manager.getLogger(filename);
};

exports.initLogger = function(init_path, save_path='./', ignore=[]) {
    // Collect all info (or upper) to one file
    log_manager.registAppenders(`_log_common_collection`, {
        type: 'dateFile',
        filename: path.join(save_path, 'log_common_collection'),
        pattern: '-yyyy-MM.log',
        alwaysIncludePattern: true,
        layout: {
            type: 'pattern',
            pattern: '%d [%p] appears on %c: %m'
        }
    });

    log_manager.registAppenders(`log_common_collection`, {
        type: 'logLevelFilter',
        appender: `_log_common_collection`,
        level: 'info'
    });

    registFileLogger('default', path.join(save_path, 'default'));
    console.log(init_path);

    fs.readdir(init_path, iter_floders(init_path, '', save_path, new Set(ignore)));
};

exports.CreateErrorType = function(options={}, error_constructor=function(){}) {
    const error_object =  class extends BasicError {
        constructor() {
            super(options);
            this.name = options.error_name | "BasicError";
            Error.captureStackTrace(this, error_object);
            error_constructor.apply(this, arguments);
        }
    }
    return error_object;
};

exports.basic_class = BasicError;
