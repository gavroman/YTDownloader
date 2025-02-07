import {DisplayFormat} from '@src/types';
import {Markup} from 'telegraf';

export const getFormatsKeyboard = (formats: DisplayFormat[]) =>
    Markup.inlineKeyboard(
        formats.map(({video, audio}) =>
            Markup.button.callback(
                `${video.width}x${video.height}`,
                JSON.stringify({v: video.format_id, a: audio.format_id})
            )
        )
    );
