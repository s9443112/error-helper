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

exports.default_option = function(obj) {
    for(var key in options) {
        obj[key] = obj[key] || options[key];
    }
};

function BasicError() {
    exports.default_option(this);
}

BasicError.prototype.__proto__ = Error.prototype;

BasicError.prototype.get_logger_type = function() {
    return (level.has(this.level)) ? this.level : "trace";
};

BasicError.prototype.make_response = function() {
    return JSON.stringify({
        status: this.error_code,
        message: this.reply_message,
    });
};

BasicError.prototype.get_stack_info = function() {
    return [this.error_name + ": " + this.message].concat(new Error().stack.split('\n').slice(3));;
};

BasicError.prototype.get_caller_file = function(ignore_name=undefined) {
    var e = new Error();
    var originalFunc = Error.prepareStackTrace;
    var caller_file = "default";
    var ignore_list = [ path.basename(__filename) ];
    ignore_name && ignore_list.push(path.basename(ignore_name));

    try {
        Error.prepareStackTrace = function (err, stack) { return stack; };
        while (e.stack.length) {
            var filename = path.basename(e.stack.shift().getFileName());
            if (!ignore_list.includes(filename)) {
                caller_file = filename;
                break;
            }
        }
    } catch (e) {
        console.trace(e);
    }
    Error.prepareStackTrace = originalFunc;
    return caller_file;
}

BasicError.prototype.echo_stack_trace = function() {
    var stack = this.get_stack_info();
    var filename = this.get_caller_file();
    var logger = log_manager.getLogger(`${filename}_stack`);
    for(var i = 0; i < stack.length; ++i) {
        logger.trace(stack[i]);
    }
    logger.trace("");
};

BasicError.prototype.print = function() {
    var filename = this.get_caller_file();
    var logger = log_manager.getLogger(`${filename}`);
    logger[this.get_logger_type()](`${this.error_name}: ${this.message}`);;
};

BasicError.prototype.toString = function() {
    var stack = this.get_stack_info();
    return `Error ${this.error_name} on \n ${stack.join("\n")}`;
};

BasicError.prototype.request_recoder = function(request) {
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
};

BasicError.prototype.all = function(req, res) {
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
        res.writeHead(this.error_status, {
            "Content-Type": "application/json"
        });
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
};

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
    filename = (filename && path.basename(filename)) || BasicError.prototype.get_caller_file();
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

exports.CreateErrorType = function(options={}, error_object=function(){}) {
    for(var key in exports.options) {
        error_object.prototype[key] = error_object.prototype[key] || options[key] || exports.options[key];
    }
    error_object.prototype.__proto__ = BasicError.prototype;
    return error_object;
};

exports.basic_class = BasicError;
