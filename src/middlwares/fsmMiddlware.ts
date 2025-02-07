import {SessionService} from '@src/services/session';
import {getFSM} from '@src/state';
import type {BotContext} from '@src/types';
import type {MiddlewareFn} from 'telegraf';

export const finiteStateMachineMiddlware: MiddlewareFn<BotContext> = async (ctx, next) => {
    const state = await SessionService.getSessionState(ctx);
    if (!state) {
        await SessionService.setSessionState(ctx, 'idle');
    }
    ctx.fsm = ctx.fsm || getFSM(ctx.session.state);
    ctx.fsm.onStateChange((state) => SessionService.setSessionState(ctx, state));

    return next();
};
