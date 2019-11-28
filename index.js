exports.http = require("./libs/http/");
exports.socket = require("./libs/socket/");

exports.BasicError = require("./libs/BasicError.js");
exports.initLogger = require("./libs/initLogger.js");
exports.getFileLogger = require("./libs/log-manager.js").getFileLogger;
exports.CheckerBuilder = exports.http.CheckerBuilder;
exports.ErrorTypes = exports.http.ErrorTypes;
exports.ErrorTypeHelper = exports.ErrorTypes.ErrorTypeHelper;

Error.prepareStackTrace = function (err, stack) {
    var stack_info = [
    ];
    for(var s of stack) {
        stack_info.push({
            functionName: s.getFunctionName(),
            // methodName: s.getMethodName(),
            fileName: s.getFileName(),
            lineNumber: s.getLineNumber(),
            // typeName: s.getTypeName()
        });
    }

    err._stack_info = stack_info;

    var stacks = stack_info;
    var return_string = `${err.name}: ${err.message}\n`;
    for (var info of stacks) {
        if(info.functionName) {
            return_string += `   at: ${info.functionName} (${info.fileName}:${info.lineNumber})\n`;
        } else {
            return_string += `   at: ${info.fileName}:${info.lineNumber}\n`;
        }
    }
    return return_string;
};

process.on("uncaughtException", function(error) {
    console.log(error);
    process.exit(1);
});
