import {gotVideoUrlAction} from '@src/actions/gotVideoUrlAction';
import {onSelectedFormatAction, SELECT_FROMAT_ACTION} from '@src/actions/selectedFormatAction';
import {BotCallbackDataContext, BotMessageContext, NextFn} from '@src/app/types';
import {withAuthCheck} from '@src/helpers/highOrderHandler';
import {parseCallbackDataType} from '@src/helpers/callbackData';

export const onStart = (ctx: BotMessageContext) => {
    ctx.session.state = 'idle';

    return ctx.reply(
        'Привет, я бот-качалка видео из YouTube! Мне нужно отправить ссылку на видео и я его скачаю',
    );
};

export const onHelp = (ctx: BotMessageContext) =>
    ctx.reply('Пришли мне ссылку на ютуб видео, и я его скачаю!');

export const textHandler = (ctx: BotMessageContext, next: NextFn) =>
    ctx.message.text.startsWith('/') ? next() : gotVideoUrlAction(ctx);

export const callbackDataHandler = (ctx: BotCallbackDataContext, next: NextFn) =>
    parseCallbackDataType(ctx.update.callback_query.data) === SELECT_FROMAT_ACTION
        ? onSelectedFormatAction(ctx, true)
        : next();

export const privateHandler = withAuthCheck((ctx: BotMessageContext) => ctx.reply('private'));
