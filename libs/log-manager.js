const logger = require('log4js');

var config = {
    appenders: {
        stack_trace : {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: '%[[%c]STACK: %m%]'
            }
        },
        out: { type: 'stdout', layout: { type: 'coloured' } }
    },
    categories: {
        stack_trace: {
            appenders: ['stack_trace'],
            level: 'trace'
        },
        default: { appenders: ['out'], level: 'info' }
    }
};


var config_changed = true; // lazy init
exports.getLogger = function(category) {
    if(config_changed) {
        config_changed = false;
        logger.configure(config);
    }
    return logger.getLogger(category);
};

exports.registAppenders = function(name, option) {
    config_changed = true;
    config.appenders[name] = option;
};

exports.registCategory = function(name, options) {
    config_changed = true;
    if(!options.appenders || options.appenders.length == 0) {
        throw new Error("appenders undefined");
    }
    for(var appender in options.appenders) {
        if(!config.appenders[options.appenders[appender]]) {
            throw new Error(`appender ${options.appenders[appender]} undefiend`);
        }
    }
    config.categories[name] = options;
};
