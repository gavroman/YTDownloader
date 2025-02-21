import {BotContext} from '@src/app/types';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const resolveModuleLoggerSync = (ctx: BotContext, moduleName: string) =>
    ctx.logger.child({moduleName});

export const mainLoggerInstance = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            level: 'silly',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.prettyPrint({colorize: true, depth: 2}),
            ),
        }),
        new DailyRotateFile({
            dirname: 'logs',
            filename: 'combined.log',
            level: 'verbose',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
    ],
});
