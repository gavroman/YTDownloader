import {BotContext} from '@src/types';
import {pick} from '@src/utils/pick';
import {resolveUpdateIdSync, resolveUserSync} from '@src/utils/telegraf';
import {MiddlewareFn} from 'telegraf';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const loggerMiddlware: MiddlewareFn<BotContext> = (ctx, next) => {
    const fullUser = resolveUserSync(ctx);
    const user = fullUser ? pick(fullUser, ['username', 'id', 'first_name', 'last_name']) : null;
    const updateId = resolveUpdateIdSync(ctx);

    ctx.logger = winston.createLogger({
        level: 'info',
        defaultMeta: {updateId, user},
        transports: [
            new winston.transports.Console({
                level: 'silly',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.prettyPrint({colorize: true, depth: 2})
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

    return next();
};
