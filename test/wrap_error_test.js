const { ErrorTypeHelper, ErrorTypes, initLogger, CheckerBuilder } = require("../index.js");
const verifyError = new ErrorTypes.VerifyError("Unit Test Error");

function errorFunction() {
    throw new Error("test error");
}

function catchErrorFunction() {
    try {
        errorFunction()
    } catch (error) {
        var a = new ErrorTypes.ProgramError(error);
        console.log(a.inspect());
        a.all();
    }
}

initLogger("./", "./test_log_files/", ["util", "test_log_files"]);
setTimeout(function() {
    catchErrorFunction();
}, 1000);
