import {BotContext, SessionState} from '@src/app/types';

const getSessionState = async (ctx: BotContext) => ctx.session.state;
const setSessionState = async (ctx: BotContext, state: SessionState) => (ctx.session.state = state);

export const SessionService = {
    getSessionState,
    setSessionState,
};
