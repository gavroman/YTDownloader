import {Telegraf} from 'telegraf';
import LocalSession from 'telegraf-session-local';
import {callbackDataHandler, onHelp, onStart, privateHandler, textHandler} from '@src/app/handlers';
import {callbackQuery, message} from 'telegraf/filters';
import {getEnv} from '@src/app/env';
import type {BotContext} from '@src/app/types';
import {storageInitMiddlware} from '@src/middlwares/storageInitMiddlware';
import {HANDLER_TIMEOUT} from '@src/app/constants';

import {getLoggerMiddlware} from '@src/middlwares/loggerMiddlware';
import {asyncHandler} from '@src/helpers/highOrderHandler';

import {mainLoggerInstance} from '@src/services/logger';
import {gotListMyUploads} from '@src/actions/gotListMyUploads';

export const launchBot = async () => {
    const {botToken} = getEnv();
    const bot = new Telegraf<BotContext>(botToken, {handlerTimeout: HANDLER_TIMEOUT});

    bot.use(getLoggerMiddlware(mainLoggerInstance));

    bot.use(new LocalSession().middleware());
    bot.use(storageInitMiddlware);

    bot.start(asyncHandler(onStart));
    bot.help(asyncHandler(onHelp));

    bot.on(message('text'), (ctx, next) => textHandler(ctx, next));
    bot.on(callbackQuery('data'), (ctx, next) => callbackDataHandler(ctx, next));

    bot.command('private', privateHandler);
    bot.command('list_my_uploads', gotListMyUploads);

    await bot.launch();
};
