import {BotContext, BotState} from '@src/types';

const getSessionState = async (ctx: BotContext) => ctx.session.state;

const setSessionState = async (ctx: BotContext, state: BotState) => (ctx.session.state = state);

export const SessionService = {
    getSessionState,
    setSessionState,
};
