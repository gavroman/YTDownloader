import {Telegraf} from 'telegraf';
import LocalSession from 'telegraf-session-local';
import {onHelp, onStart, onTextMessage} from '@src/handlers';
import {callbackQuery, message} from 'telegraf/filters';
import {getEnv} from '@src/services/env';
import type {BotContext} from '@src/types';
import {onSelectedFormatAction} from '@src/actions/selectedFormatAction';
import {storageInitMiddlware} from '@src/middlwares/storageInitMiddlware';
import {initS3Middlware} from '@src/middlwares/initS3Middlware';
import {HANDLER_TIMEOUT} from '@src/constants';

import {loggerMiddlware} from '@src/middlwares/loggerMiddlware';

const {botToken} = getEnv();
const bot = new Telegraf<BotContext>(botToken, {handlerTimeout: HANDLER_TIMEOUT});
bot.use(loggerMiddlware);
bot.use(new LocalSession({state: {state: 'idle', asd: 'asdasd'}}).middleware());
bot.use(storageInitMiddlware);
bot.use(initS3Middlware);

bot.start(onStart);
bot.help(onHelp);

bot.on(message('text'), (ctx) => onTextMessage(ctx));
bot.on(callbackQuery('data'), (ctx) => onSelectedFormatAction(ctx));

await bot.launch();
