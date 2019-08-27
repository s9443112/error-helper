const ErrorTypes = require("./ErrorTypes.js");
const getFileLogger = require("../log-manager.js").getFileLogger;
class CheckerBuilder {
    /**
     *
     * @param {Array<Function>} check_function 範例 `check_function_example`
     */
    constructor(check_functions) {
        for(var i = 0; i < check_functions.length; ++i) {
            if(typeof(check_functions[i]) !== 'function') {
                throw ErrorTypes.ProgramError('checker must a function');
            }
        }
        this.checkers = check_functions;
    }

    /**
     * 加入檢查function
     * @param {function} check_function 範例 `check_function_example`
     */
    add_function(check_function) {
        if(typeof(check_function) !== 'function') {
            throw ErrorTypes.ProgramError('checker must a function');
        }
        this.checkers.push(check_function);
    }

    /**
     * 建立middleware
     */
    create_middleware_checker() {
        var checkers = this.checkers;

        return async function (req, res, next) {
            for(var i = 0; i < checkers.length; ++i) {
                var error = await checkers[i](req);
                if(error) {
                    return error.all(req, res);
                }
            }
            var _end = res.end;
            if(_end._is_check_builder_end_function) {
                return next && next();
            }
            var now = Date.now();
            res.end = function() {
                const file_logger = getFileLogger();
                file_logger.trace(`${req.method} ${req.originalUrl || req.url} use ${Date.now() - now} ms`);
                _end.apply(res, arguments);
                res.end = _end;
            };
            res.end._is_check_builder_end_function = true;
            next && next();
        };
    }
};

CheckerBuilder.CheckerBuilder = CheckerBuilder;
module.exports = CheckerBuilder;
