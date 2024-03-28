import { format, createLogger, transports} from 'winston';


function buildDevLogger() {
    const logFormat = format.printf(({ level, message, timestamp, stack}) => {
        return `${timestamp} | ${level} | ${stack || message}`;
    })
    
    return createLogger({
        level: 'info',
        format: format.combine(format.colorize(), format.timestamp({ format: 'YY-MM-DD HH:mm:ss' }), format.errors({stask: true}), logFormat),
        transports: [
            new transports.Console(),
            new transports.File({
                filename: 'src/logger/botlog.log',
                level: 'debug'
            })
        ]
    });
}

export const logger = buildDevLogger();
