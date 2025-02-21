import winston from 'winston';

export const testLogger = winston.createLogger({
    level: 'error',
    transports: [new winston.transports.Console()],
});
