import {BotMessageContext} from '@src/types';
import {gotVideoUrlAction} from '@src/actions/gotVideoUrlAction';

export const onStart = (ctx: BotMessageContext) => {
    ctx.session.state = 'idle';
    return ctx.reply(
        'Привет, я бот-качалка видео из YouTube! Мне нужно отправить ссылку на видео и я его скачаю'
    );
};

export const onHelp = (ctx: BotMessageContext) =>
    ctx.reply('Пришли мне ссылку на ютуб видео, и я его скачаю!');

export const onTextMessage = (ctx: BotMessageContext) => gotVideoUrlAction(ctx);
