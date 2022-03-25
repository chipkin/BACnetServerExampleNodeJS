/** 
 * Logging for debugging and errors
 */

const winston = require('winston');

var options = {
    file: {
        level: 'debug',
        filename: './app.log',
        handleExceptions: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        colorize: true,
    }
};

var logger = winston.createLogger ({
    transports: [
        new winston.transports.File(options.file),
    ],
    exitOnError: false,
    format: winston.format.combine(
        winston.format.timestamp({
            format: "MM_DD_YYYY HH:mm:ss",
        }),
        winston.format.align(),
        winston.format.printf((message) => `${[message.timestamp]} ${message.label} ${message.level}: ${message.message}`)
    ),
});

module.exports = logger;