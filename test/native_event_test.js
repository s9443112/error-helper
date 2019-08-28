const { request } = require("./util/client_helper.js");
const { start_log, msg_log, error_log, success_log, sleep, assert_event_error, assert_event_result } = require("./util/helper.js");

const { initLogger } = require("../index.js");
const { ErrorTypeHelper, ErrorTypes, CheckerBuilder, SocketWrapper } = require("../index.js").socket;
const { ErrorTypes: HttpErrorTypes } = require("../index.js").http;
const EventEmitter = require('events');

const assert = require("assert").strict;

ErrorTypes.ErrorTypeHelper("TestError", {
    level: "error",
    stack_trace: true,
    error_status: 412,
    error_code: -120,
    message: "this is a test",
    reply_message: "test success",
    record_args: true,
    reply_event: "AAA"
});

initLogger("./", "./test_log_files/", ["util", "test_log_files", "node_modules", ".git"]);

async function unit_test(roomName) {
    await sleep(500);

    var test_1 = false, test_2 = false;
    function test1() {
        test_1 = true;
    }

    function test2() {
        test_2 = true;
    }

    function throwNativeError() {
        throw new Error("testError");
    }

    function throwHttpProgramError() {
        throw new HttpErrorTypes.ProgramError("http programError");
    }

    function throwSocketVerifyError() {
        throw new ErrorTypes.VerifyError("Test Error", "TEST");
    }

    function throwTestError() {
        throw new ErrorTypes.TestError("The Test Error", "TEST");
    }

    function innerTest1(arg1, arg2) {
        if(arg1.a === 1 && arg1.b === 2 && arg2 === "HI") {
            arg1.a = 123;
            return;
        }
        throw new Error("innerTest1 param Error");
    }

    var checker = new CheckerBuilder([
        innerTest1
    ]).create_middleware_checker();

    var emitter = new EventEmitter();
    var [ arg1, arg2 ] = await assert_event_result(emitter, [
        "test1",
        { a: 1, b: 2 },
        "HI"
    ], [
        "test1",
        test1,
        test2,
        checker
    ]);
    if(test1 === false) {
        throw new Error("test 1 not exec");
    }

    if(test2 === false) {
        throw new Error("test 2 not exec");
    }

    if (arg1.a !== 123 && arg2 !== "HI") {
        throw new Error("innerTest1 not exec");
    }

    var error = await assert_event_error(emitter, [
        "test1",
        { a: 2, b: 2 },
        "HI"
    ], [
        "test1",
        test1,
        test2,
        checker,
        throwHttpProgramError
    ]);

    if(error.name !== "ProgramError") {
        throw error;
    }
    if(error.message !== "innerTest1 param Error") {
        throw error;
    }

    error = await assert_event_error(emitter, [
        "test1",
        { a: 1, b: 2 },
        "HI"
    ], [
        "test1",
        test2,
        throwHttpProgramError,
        checker
    ]);

    if (error.name !== "ProgramError") {
        throw error;
    }
    if (error.message !== "http programError") {
        throw error;
    }

    error = await assert_event_error(emitter, [
        "test1",
        { a: 1, b: 2 },
        "HI"
    ], [
        "test1",
        test2,
        throwSocketVerifyError,
        throwHttpProgramError,
        checker
    ]);

    if (error.name !== "VerifyError") {
        throw new Error("Error name not match");
    }
    if (error.message !== "Test Error") {
        throw new Error("Error message not match");
    }

    error = await assert_event_error(emitter, [
        "test1",
        { a: 1, b: 2 },
        "HI"
    ], [
        "test1",
        test2,
        throwTestError,
        throwSocketVerifyError,
        throwHttpProgramError,
        throwTestError,
        checker
    ]);

    if (error.name !== "TestError") {
        throw new Error("Error name not match");
    }
    if (error.message !== "this is a test") {
        throw new Error("Error message not match");
    }

    var promise = listen_event(emitter, "AAA");
    error.all([{ a:1, b: 2}], emitter);
    var [ res ] = await promise;
    if(res.status !== -120 && res.message === 'test success') {
        throw new Error(`response error ${JSON.stringify(res)} `);
    }
}

async function listen_event(emitter, event) {
    var success,failed;
    var timeout = setTimeout(function() {
        failed(new Error("TIMEOUT"));
    }, 1000);
    var promise = new Promise((reslove, reject)=>{
        success = reslove;
        failed = reject;
    });
    emitter.on(event, function(...args) {
        clearTimeout(timeout);
        success(args);
    });
    return promise;
}

async function main(roomName) {
    try {
        await unit_test(roomName);
        success_log("socket error test success");
    } catch(e) {
        console.log(e);
        error_log("unit test failed");
        process.exit(1);
    }
}

if(require.main === module) {
    main();
}
