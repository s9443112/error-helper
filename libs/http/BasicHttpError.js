var http = require("http");
var BasicError = require("../BasicError.js");
const log_manager = require('../log-manager.js');

class BasicHttpError extends BasicError {
    constructor(options) {
        super(options);
        Error.captureStackTrace(this, BasicHttpError);
        this.error_status = options.error_status || 403,
        this.error_code = options.error_code || 0;
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
        };
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
                res.writeHead(this.error_status, this.get_head());
                res.end(this.make_response());
            }
            return;
        }
        return this.make_response();
    }
}

module.exports = BasicHttpError;
