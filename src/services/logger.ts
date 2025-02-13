import {BotContext} from '@src/types';

export const resolveModuleLoggerSync = (ctx: BotContext, moduleName: string) =>
    ctx.logger.child({moduleName});
