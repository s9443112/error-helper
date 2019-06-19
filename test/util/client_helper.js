const http = require("http");

function request(url, opt={ method: "GET" }, data) {
    var success, failed;
    var promise = new Promise((reslove, reject)=>{
        success = reslove;
        failed = reject;
    });
    var resp = { body: "" };
    var req = http.request("http://127.0.0.1:6391", opt, function(res) {
        resp.statusCode = res.statusCode;
        res.setEncoding('utf8');
        res.on("data", function(chunk) {
            resp.body += chunk;
        });
        res.on("end", function() {
            // console.log("HI");
            success(resp);
        });
        // res.on("error", function(e) {
        //     failed(e);
        // });
    });

    req.on("error", function(e) {
        failed(e);
    });
    req.end();
    return promise;
}

exports.request = request;