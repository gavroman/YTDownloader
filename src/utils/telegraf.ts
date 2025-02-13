import type {BotContext, BotMessageContext} from '@src/types';
import {User} from 'telegraf/types';
import path from 'path';
import {BASE_STORAGE_DIRNAME} from '@src/constants';

export const replyOnMessage = (ctx: BotMessageContext, ...args: Parameters<BotMessageContext['reply']>) =>
    ctx.reply(args[0], {...args[1], reply_parameters: {message_id: ctx.message.message_id}});

export const getUser = (ctx: BotContext) => ctx.from;

export const getUserDirname = (user: Pick<User, 'username' | 'id'>, baseDirname = BASE_STORAGE_DIRNAME) => {
    const userDirname = user.username || String(user.id);
    return path.resolve('.', path.join(baseDirname, userDirname));
};
