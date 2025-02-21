import {BotContext} from '@src/app/types';
import {pick} from '@src/utils/pick';
import {resolveUpdateIdSync, resolveUserSync} from '@src/utils/telegraf';
import {MiddlewareFn} from 'telegraf';
import winston from 'winston';

export const getLoggerMiddlware =
    (logger: winston.Logger): MiddlewareFn<BotContext> =>
    (ctx, next) => {
        const fullUser = resolveUserSync(ctx);
        const user = fullUser ? pick(fullUser, ['username', 'id', 'first_name', 'last_name']) : null;
        const updateId = resolveUpdateIdSync(ctx);
        ctx.logger = logger.child({updateId, user});

        return next();
    };
