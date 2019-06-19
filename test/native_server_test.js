const { createServer, closeServer, addMiddleware } = require("./util/server_helper.js");
const { request } = require("./util/client_helper.js");
const { start_log, msg_log, error_log, success_log, sleep } = require("./util/helper.js");
const { ErrorTypeHelper, ErrorTypes, initLogger, CheckerBuilder } = require("../index.js");
const assert = require("assert").strict;
const { spawn } = require('child_process');

// var rm = spawn('rm', ['-rf', './test_log_files']);

ErrorTypeHelper("TestError", {
    level: "error",
    stack_trace: false,
    error_status: 412,
    error_code: -120,
    message: "this is a test",
    reply_message: "test success"
});

// rm.on("close", function() {
// });

initLogger("./", "./test_log_files/", ["util", "test_log_files"]);
var cb = function() {
};

function error_cb(error) {
    cb(error);
}


async function unit_test() {
    await sleep(1000);
    start_log("middleware test start");
    const server = await createServer(error_cb);

    const verifyError = new ErrorTypes.VerifyError("Unit Test Error");

    function m_1(req) {
        if(req.headers["test"] !== "GOOD") {
            return verifyError;
        }
        req.body = "test body recored";
    }

    var test_error = new ErrorTypes.TestError();
    function m_2(req) {
        success();
        return test_error;
    }

    function m_3(req) {
        // can't access this middleware
        throw new ErrorTypes.VerifyError("Unit Test Error on m_3");
    }

    var success, failed;
    var callback_promise = new Promise((reslove, reject)=>{
        success = reslove;
        failed = reject;
    });

    cb = function(error) {
        failed(error);
    };

    addMiddleware(new CheckerBuilder.CheckerBuilder([
        m_1,
        m_2,
        m_3
    ]).create_middleware_checker());


    var http_request = request(server.url, { method: "GET", headers: { "TEST": "GOOD" }});
    var [_, res] = await Promise.all([callback_promise, http_request]);
    var body = JSON.parse(res.body);
    assert.strictEqual(body.status, -120);
    assert.strictEqual(res.statusCode, 412);
    assert.strictEqual(body.message, "test success");

    server.close();

}

async function main(roomName) {
    try {
        await unit_test(roomName);
        success_log("middleware test success");
    } catch(e) {
        console.log(e);
        error_log("unit test failed");
        process.exit(1);
    }
}

if(require.main === module) {
    main();
}