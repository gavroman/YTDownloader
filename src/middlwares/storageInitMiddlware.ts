import {MessageService} from '@src/services/messages';
import {SessionService} from '@src/services/session';
import {BotContext} from '@src/app/types';
import {MiddlewareFn} from 'telegraf';

export const storageInitMiddlware: MiddlewareFn<BotContext> = async (ctx, next) => {
    if (!(await SessionService.getSessionState(ctx))) {
        await SessionService.setSessionState(ctx, 'idle');
    }

    await MessageService.initMessages(ctx);

    return next();
};
