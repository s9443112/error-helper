const fs = require("fs");
const path = require("path");
const log_manager = require('./log-manager.js');
const trace_logger_name = "stack_trace";

function registFileLogger(log_name, path) {
    console.log(`setting log file ${log_name} on ${path}`);
    log_manager.registAppenders(`${log_name}_time`,  {
        type: 'dateFile',
        filename: path,
        pattern: '-yyyy-MM.log',
        alwaysIncludePattern: true,
        layout: {
            type: 'pattern',
            pattern: '[%d] %p: %m'
        }
    });

    log_manager.registAppenders(`${log_name}_all`, {
        type: 'dateFile',
        filename: path,
        pattern: '-yyyy-MM.log',
        alwaysIncludePattern: true,
        layout: {
            type: 'pattern',
            pattern: '[%p]: %m'
        }
    });

    // log_manager.registAppenders(`${log_name}_stack`, {
    //     type: 'dateFile',
    //     filename: path,
    //     pattern: '-yyyy-MM.log',
    //     alwaysIncludePattern: true,
    //     layout: {
    //         type: 'pattern',
    //         pattern: '[%c] STACK: %m'
    //     }
    // });

    log_manager.registAppenders(`${log_name}_console_record`, {
        type: 'console',
        layout: {
            type: 'pattern',
            pattern: '%[%d [%p] %m%]'
        }
    });

    log_manager.registAppenders(`_${log_name}_file_record`, {
        type: 'dateFile',
        filename: path,
        pattern: '-yyyy-MM.log',
        alwaysIncludePattern: true,
        layout: {
            type: 'pattern',
            pattern: '%d [%p] %m'
        }
    });

    log_manager.registAppenders(`${log_name}_file_record`, {
        type: 'logLevelFilter',
        appender: `_${log_name}_file_record`,
        level: 'error'
    });

    // -------------
    log_manager.registCategory(`${log_name}_time`, {
        appenders: [`${log_name}_time`],
        level: 'all'
    });

    log_manager.registCategory(`${log_name}_all`, {
        appenders: [`${log_name}_all`],
        level: 'all'
    });

    log_manager.registCategory(`${log_name}_stack`, {
        appenders: [trace_logger_name, `${log_name}_all`],
        level: 'all'
    });

    log_manager.registCategory(log_name, {
        appenders: [`${log_name}_file_record`, `${log_name}_console_record`, `log_common_collection`],
        level: 'all'
    });

}

function iter_floders (basic_path, iter_path, save_path, ignore) {
    var fullpath = path.join(basic_path, iter_path);
    return function(err, files) {
        if(err) {
            console.log(err);
            return;
        }
        files.forEach(function(file) {
            var joinpath = path.join(fullpath, file);
            fs.stat(joinpath , function( error, stat ) {
                if(error) {
                    console.log(error);
                    return;
                }
                if(ignore.has(file)) {
                    return;
                }
                if(stat.isFile()) {
                    registFileLogger(file, path.join(save_path, path.join(iter_path, file)));
                } else {
                    fs.readdir(joinpath, iter_floders(basic_path, path.join(iter_path, file), save_path, ignore));
                }
            });
        });
    };
}

module.exports = function(init_path, save_path='./', ignore=[]) {
    // Collect all info (or upper) to one file
    log_manager.registAppenders(`_log_common_collection`, {
        type: 'dateFile',
        filename: path.join(save_path, 'log_common_collection'),
        pattern: '-yyyy-MM.log',
        alwaysIncludePattern: true,
        layout: {
            type: 'pattern',
            pattern: '%d [%p] appears on %c: %m'
        }
    });

    log_manager.registAppenders(`log_common_collection`, {
        type: 'logLevelFilter',
        appender: `_log_common_collection`,
        level: 'info'
    });

    registFileLogger('default', path.join(save_path, 'default'));
    console.log(init_path);

    fs.readdir(init_path, iter_floders(init_path, '', save_path, new Set(ignore)));
};