exports.start_log = function(msg) {
    console.log((new Date()).toISOString() + `: \x1b[1;33;40m${msg}\x1b[0m`);
};

exports.msg_log = function(msg) {
    console.log((new Date()).toISOString() + `: \x1b[1;34;40m${msg}\x1b[0m`);
};

exports.error_log = function(msg) {
    console.log((new Date()).toISOString() + `: \x1b[2;31;40m${msg}\x1b[0m`);
};

exports.success_log = function(msg) {
    console.log((new Date()).toISOString() + `: \x1b[2;32;40m${msg}\x1b[0m`);
};

exports.debug_log = function(msg) {
    console.log((new Date()).toISOString() + `: \x1b[3;34;40m${msg}\x1b[0m`);
};

exports.sleep = function(timeout) {
    return new Promise((reslove, reject)=>{
        setTimeout(()=>{
            reslove();
        }, timeout);
    });
};