import {YtDlp} from '@src/services/yt-dlp';
import {BotMessageContext, DisplayFormat, Format} from '@src/app/types';
import {replyOnMessage} from '@src/utils/telegraf';
import percentile from 'percentile';
import {MAX_TG_FILE_LIMIT_BYTES} from '@src/app/constants';
import {MessageService} from '@src/services/messages';
import {getDurationString, getTextFromMessageStoredData} from '@src/helpers/outputText';
import {getFormatsKeyboard} from '@src/helpers/outputMarkup';
import {resolveModuleLoggerSync} from '@src/services/logger';
import {asyncHandler} from '@src/helpers/highOrderHandler';

export const gotVideoUrlAction = asyncHandler(async (ctx: BotMessageContext) => {
    const logger = resolveModuleLoggerSync(ctx, 'gotVideoUrlAction');

    const videoUrl = ctx.message.text.trim();
    logger.info({videoUrl});

    try {
        const {protocol, host} = new URL(videoUrl);
        if (protocol !== 'https:' || !host.includes('you')) {
            throw new Error('Invalid url');
        }
    } catch (_e) {
        logger.warn('Invalid url');

        return replyOnMessage(ctx, 'Неправильная ссылка, такое не скачать, даже если очень постараться');
    }

    const yt = await YtDlp.init(ctx.logger);
    try {
        const videoInfo = await yt.$getVideoInfo(videoUrl);
        if (!videoInfo) {
            logger.error('No video info');

            return replyOnMessage(ctx, 'Не получилось достать информацию о видео, можно еще раз ссылочку?');
        }

        const {title: videoTitle, formats: allFormats, duration} = videoInfo;
        logger.info('videoInfo', videoInfo);
        const formats = selectDisplayFormats(allFormats);
        const videoDuration = getDurationString(duration);

        logger.info('videoDuration', videoDuration);
        await MessageService.addMessage(ctx, ctx.message.message_id, {
            videoUrl,
            videoTitle,
            videoDuration,
            formats,
        });

        const text = getTextFromMessageStoredData({videoTitle, videoDuration, formats});
        await replyOnMessage(ctx, text, {parse_mode: 'HTML', ...getFormatsKeyboard(formats)});

        logger.verbose(
            'Formats',
            formats.map(({audio}) => audio),
        );
    } catch (e) {
        logger.error(e);

        return replyOnMessage(ctx, 'Не получилось достать доступные форматы этого видоса(');
    }
});

export const selectDisplayFormats = (formats: Format[]): DisplayFormat[] => {
    const httpsAudioFormats = formats.filter(
        ({audio_ext, protocol}) => audio_ext && audio_ext === 'mp4' && protocol === 'm3u8_native',
    );

    const httpsVideoFormats = formats.filter(({video_ext, vbr, protocol, width, format_note}) => {
        if (!video_ext || video_ext !== 'mp4' || !vbr || protocol !== 'm3u8_native') {
            return false;
        }

        if (width < 600) {
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
        Math.floor(((n + 1) / finalVideoFormats.length) * 100),
    );
    const finalAudioFormats = (
        percentile(percentilesToGet, Array.from(httpsAudioFormats.keys())) as number[]
    ).map((i) => httpsAudioFormats[i]);

    return finalVideoFormats.map((video, i) => ({video, audio: finalAudioFormats[i]}));
};
