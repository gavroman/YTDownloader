import {YtDlp} from '@src/services/yt-dlp';
import {BotMessageContext, DisplayFormat, Format} from '@src/types';
import {replyOnMessage} from '@src/utils/telegraf';
import percentile from 'percentile';
import {MAX_TG_FILE_LIMIT_BYTES} from '@src/constants';
import {MessageService} from '@src/services/messages';
import {getDurationString, getTextFromMessageStoredData} from '@src/helpers/outputText';
import {getFormatsKeyboard} from '@src/helpers/outputMarkup';

export const gotVideoUrlAction = async (ctx: BotMessageContext) => {
    const videoUrl = ctx.message.text.trim();
    console.log('gotVideoUrlAction: ', videoUrl);

    try {
        const {protocol, host} = new URL(videoUrl);
        if (protocol !== 'https:' || !host.includes('you')) {
            throw new Error('Invalid url');
        }
    } catch (_e) {
        return ctx.reply('Неправильная ссылка, такое не скачать, даже если очень постараться');
    }

    const yt = await YtDlp.init(ctx.from);
    console.log(yt);

    try {
        const {title: videoTitle, formats: allFormats, duration} = await yt.$getVideoInfo(videoUrl);
        console.log('videoTitle', videoTitle);
        const formats = selectDisplayFormats(allFormats);
        const videoDuration = getDurationString(duration);

        await MessageService.addMessage(ctx, ctx.message.message_id, {
            videoUrl,
            videoTitle,
            videoDuration,
            formats,
        });

        const text = getTextFromMessageStoredData({videoTitle, videoDuration, formats});
        await replyOnMessage(ctx, text, {parse_mode: 'HTML', ...getFormatsKeyboard(formats)});

        // ctx.fsm.makeTransition('formatsListed');

        console.table(formats.map(({audio}) => audio));
        console.table(formats.map(({video}) => video));
        console.log('gotVideoUrlAction', text);
    } catch (e) {
        console.error(e);
        return replyOnMessage(ctx, 'Не получилось достать доступные форматы этого видоса(');
    }
};

export const selectDisplayFormats = (formats: Format[]): DisplayFormat[] => {
    const httpsAudioFormats = formats.filter(
        ({audio_ext, abr, protocol}) => audio_ext && audio_ext === 'm4a' && abr && protocol === 'https'
    );
    const maxAudioFormatSize = httpsAudioFormats.at(-1)?.filesize;
    const httpsVideoFormats = formats.filter(({video_ext, vbr, protocol, filesize, width, format_note}) => {
        if (!video_ext || video_ext !== 'mp4' || !vbr || protocol !== 'https') {
            return false;
        }

        if (filesize > MAX_TG_FILE_LIMIT_BYTES - (maxAudioFormatSize || 0) || width < 600) {
            return false;
        }

        if (format_note && parseInt(format_note) < 480) {
            return false;
        }

        return true;
    });
    const widthsMap = httpsVideoFormats.reduce<Record<number, Format>>((result, format) => {
        const {width, vbr} = format;
        if (!result[width] || result[width].vbr < vbr) {
            result[width] = format;
        }

        return result;
    }, {});
    const finalVideoFormats = Object.values(widthsMap);

    const percentilesToGet = Array.from(finalVideoFormats.keys()).map((n) =>
        Math.floor(((n + 1) / finalVideoFormats.length) * 100)
    );
    const finalAudioFormats = (
        percentile(percentilesToGet, Array.from(httpsAudioFormats.keys())) as number[]
    ).map((i) => httpsAudioFormats[i]);

    return finalVideoFormats.map((video, i) => ({video, audio: finalAudioFormats[i]}));
};
