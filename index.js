exports.http = require("./libs/http/");
exports.socket = require("./libs/socket/");

exports.BasicError = require("./libs/BasicError.js");
exports.initLogger = require("./libs/initLogger.js");
exports.getFileLogger = require("./libs/log-manager.js").getFileLogger;
exports.CheckerBuilder = exports.http.CheckerBuilder;
exports.ErrorTypes = exports.http.ErrorTypes;
exports.ErrorTypeHelper = exports.ErrorTypes.ErrorTypeHelper;

Error.prepareStackTrace = function (err, stack) {
    var stack_info = {
        message: err.message,
        stack: []
    };
    for(var s of stack) {
        stack_info.stack.push({
            functionName: s.getFunctionName(),
            // methodName: s.getMethodName(),
            fileName: s.getFileName(),
            lineNumber: s.getLineNumber(),
            // typeName: s.getTypeName()
        });
    }
    return stack_info;
};

const Console = require("console");
const util = require("util");
const origin = util.inspect;
util.inspect = function(error) {
    if(error instanceof exports.BasicError) {
        return error.inspect();
    }
    if(error instanceof Error) {
        var stacks = error.stack.stack;
        var return_string = `${error.name}: ${error.message}\n`;
        for (var stack of stacks) {
            if(stack.functionName) {
                return_string += `   at: ${stack.functionName} (${stack.fileName}:${stack.lineNumber})\n`;
            } else {
                return_string += `   at: ${stack.fileName}:${stack.lineNumber}\n`;
            }
        }
        return return_string;
    }
    origin.apply(util, arguments);
};

const log = console.log;
console.log = function(...args) {
    const error = args[0];
    if(error instanceof exports.BasicError) {
        return log(error.inspect());
    }
    if(error instanceof Error) {
        var stacks = error.stack.stack;
        var return_string = `${error.name}: ${error.message}\n`;
        for (var stack of stacks) {
            if(stack.functionName) {
                return_string += `   at: ${stack.functionName} (${stack.fileName}:${stack.lineNumber})\n`;
            } else {
                return_string += `   at: ${stack.fileName}:${stack.lineNumber}\n`;
            }
        }
        return log(return_string);
    }
    return log.apply(this, args);
};

process.on("uncaughtException", function(error) {
    console.log(error);
    process.exit(1);
});
