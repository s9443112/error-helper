const { start_log, msg_log, error_log, success_log, sleep } = require("./util/helper.js");
const { ErrorTypes, initLogger } = require("../index.js");

initLogger("./", "./test_log_files/", ["util", "test_log_files"]);

const util = require("util");
async function unit_test() {
    await sleep(500);
    const error = new Error("test1");
    console.log(error);
    const error1 = new ErrorTypes.ProgramError(error);
    console.log(error1);
    const error2 = new ErrorTypes.ProgramError("test3");
    console.log(error2);
}

async function main(roomName) {
    try {
        await unit_test();
        success_log("print test success");
    } catch(e) {
        console.log(e.message);
        console.log(e.stack);
        error_log("print test failed");
        process.exit(1);
    }
}

if(require.main === module) {
    main();
}
