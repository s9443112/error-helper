# ErrorHelper
automatic error processing


# How To Use It
Go to porject folder

```
npm i --save "https://gitlab+deploy-token-68623:4VjEJwV1j_D2TUV1CRwf@gitlab.com/karta0807913/error-helper.git"
```

# sample code
```
const express = require("express");
const app = express();

const { initLogger, errorTypes } = require("error-helper");
initLogger("./src/", "./log", ['log', 'logs']);

app.get("thow_exception", function(req, res) {
    try {
        throw new Error("test error");
    } catch(error) {
        (new errorTypes.UncaughtException(error)).all(req, res);
    }
});

const server = http.createServer(app);
```

