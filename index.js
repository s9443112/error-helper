exports.ErrorHandler = require("./libs/error-handler.js");
exports.ErrorHandler.LogManager = require("./libs/log-manager.js");
exports.CheckerBuilder = require("./libs/CheckerBuilder.js");
exports.initLogger = exports.ErrorHandler.initLogger;
exports.ErrorTypes = require("./libs/error-type.js");
exports.ErrorTypeHelper = exports.ErrorTypes.ErrorTypeHelper;
exports.BasicError = exports.ErrorHandler.basic_class;

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
