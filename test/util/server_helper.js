const http = require("http");
var server = undefined;

var middleware = [];
var error_cb = undefined;

function createServer(cb) {
    if(server !== undefined) {
        throw new Error("server created");
    }
    var success;
    var promise = new Promise((reslove)=> {
        success = reslove;
    });
    error_cb = cb;
    server = http.createServer(serverHandler);

    server.on("close", ()=> {
        server = undefined;
        error_cb = undefined;
        clearMiddleware();
    });

    server.url = "127.0.0.1:6391";

    server.listen(6391, "127.0.0.1", ()=> success(server));
    return promise;
}

async function serverHandler(req, res) {
    var index = 0;
    async function next() {
        index += 1;
        if(index >= middleware.length) {
            return;
        }
        try {
            await middleware[index](req, res, next);
        } catch(error) {
            error_cb(error);
        }
    }
    if(index >= middleware.length) {
        return;
    }
    try {
        await middleware[index](req, res, next);
    } catch(error) {
        error_cb(error);
    }
}

function addMiddleware(m) {
    middleware.push(m);
}

function clearMiddleware() {
    middleware = [];
}

function closeServer() {
    if(server) {
        var success;
        const promise = new Promise((reslove)=> success = reslove);
        server.close(success);
        return promise;
    }
}

exports.closeServer = closeServer;
exports.clearMiddleware = clearMiddleware;
exports.addMiddleware = addMiddleware;
exports.createServer = createServer;