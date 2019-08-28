const { SocketWrapper } = require("../../index.js").socket;

class AssertErrorWrapper extends SocketWrapper {
    constructor(socket, success, failed) {
        super(socket);
        this._is_error = false;
        this._success = success;
        this._failed = failed;
        if(!socket.once) {
            socket.once = function(event, callback) {
                socket.on(event, function(...args) {
                    callback.apply(callback, args);
                    socket.reemoveAllListeners(event);
                });
            };
        }
    }

    socket_job_wrapper(event, funcs) {
        const origin = super.socket_job_wrapper(event, funcs);
        const self = this;
        return async function(...args) {
            const result = await origin.apply(self, args);
            if(self._is_error === false) {
                console.log("B");
                self._failed(new Error("沒有擲出錯誤"));
            }
            return result;
        };
    }

    process_uncatch_error(error, event, args) {
        this._is_error = true;
        error = super.process_uncatch_error(error, event, args);
        this._success(error);
        return {
            all: function() {}
        };
    }
}

class AssertWrapper extends SocketWrapper {
    constructor(socket, success, failed) {
        super(socket);
        this._is_error = false;
        this._success = success;
        this._failed = failed;
        if(!socket.once) {
            socket.once = function(event, callback) {
                socket.on(event, function(...args) {
                    callback.apply(callback, args);
                    socket.reemoveAllListeners(event);
                });
            };
        }
    }

    socket_job_wrapper(event, funcs) {
        const origin = super.socket_job_wrapper(event, funcs);
        const self = this;
        return async function(...args) {
            const result = await origin.apply(self, args);
            self._success(args);
        };
    }

    process_uncatch_error(error, event, args) {
        this._is_error = true;
        error = super.process_uncatch_error(error, event, args);
        this._failed(error);
        return error;
    }
}

function assert_event (wrapper, emitter, emit_args, on_args) {
    var success, failed;
    var promise = new Promise((reslove, reject) => {
        success = reslove;
        failed = reject;
    });
    emitter = new wrapper(emitter, success, failed);
    emitter.once.apply(emitter, on_args);
    emitter.emit.apply(emitter, emit_args);
    return promise;
}

exports.assert_event_error = function(emitter, emit_args, on_args) {
    return assert_event(AssertErrorWrapper, emitter, emit_args, on_args);
};

exports.assert_event_result = function(emitter, emit_args, on_args) {
    return assert_event(AssertWrapper, emitter, emit_args, on_args);
};

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