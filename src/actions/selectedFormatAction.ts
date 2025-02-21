import {getLink, getUpdateAppendMessageEditor, getTextFromMessageStoredData} from '@src/helpers/outputText';
import {FFMPEG} from '@src/services/ffmpeg';
import {resolveModuleLoggerSync} from '@src/services/logger';
import {MessageService} from '@src/services/messages';
import {YtDlp} from '@src/services/yt-dlp';
import {BotCallbackDataContext} from '@src/app/types';
import {deleteFile} from '@src/utils/file.js';
import {pick} from '@src/utils/pick';
import {getResolution} from '@src/utils/strings';
import filenamify from 'filenamify';
import {asyncHandler} from '@src/helpers/highOrderHandler';
import {S3} from '@src/services/s3';
import {SettingsService} from '@src/services/settings';

const parseCallbackData = (
    input: string,
): {videoFormatId: Nullable<string>; audioFormatId: Nullable<string>} => {
    try {
        const {v: videoFormatId, a: audioFormatId} = JSON.parse(input);

        return {videoFormatId, audioFormatId};
    } catch (_e) {
        return {videoFormatId: null, audioFormatId: null};
    }
};

export const SELECT_FROMAT_ACTION = 'select-format';

export const onSelectedFormatAction = asyncHandler(async (ctx: BotCallbackDataContext) => {
    const logger = resolveModuleLoggerSync(ctx, 'gotVideoUrlAction');

    if (
        !ctx.callbackQuery.message ||
        !('reply_to_message' in ctx.callbackQuery.message) ||
        !ctx.callbackQuery.message.reply_to_message?.message_id
    ) {
        logger.error('no reply message');

        return ctx.editMessageText(
            'Немогу прочитать прошлое сообщение, чтобы достать ссылку. Отправь ссылку еще раз.',
        );
    }
    logger.info('onSelectedFormatAction', ctx.callbackQuery.data);

    const editMessageTextHTML = getUpdateAppendMessageEditor(ctx, {parse_mode: 'HTML'});
    const {videoFormatId, audioFormatId} = parseCallbackData(ctx.callbackQuery.data);
    if (!videoFormatId || !audioFormatId) {
        logger.error('no videoFormatId or audioFormatId');

        return ctx.editMessageText(
            'Что-то сломалось, не понял какой формат был выбран. Можно еще раз ссылочку?',
        );
    }

    const messageId = ctx.callbackQuery.message.reply_to_message.message_id;
    logger.info('messageId', messageId);
    const videoData = await MessageService.getMessage(ctx, String(messageId));
    if (!videoData) {
        logger.error('no videoData');

        return ctx.editMessageText('Забыл про это видео, можно еще раз ссылочку?');
    }
    logger.info('videoData', videoData);

    const baseText = getTextFromMessageStoredData(pick(videoData, ['videoTitle', 'videoDuration']));
    await editMessageTextHTML(`${baseText}\n`);
    await editMessageTextHTML('Расчехляю скачивалку');

    const formats = await MessageService.getFormatsByMessageId(ctx, String(messageId), {
        videoFormatId,
        audioFormatId,
    });
    if (!formats?.audio || !formats?.video) {
        logger.error('no formats');

        return editMessageTextHTML('Не нашел такой формат, можно еще раз ссылочку?');
    }

    await editMessageTextHTML('Качаю видос');

    const {videoUrl: url, videoTitle} = videoData;
    const yt = await YtDlp.init(ctx.logger);
    const commonDownloadProps = {
        outputFilename: String(messageId),
        url,
        user: pick(ctx.from, ['id', 'username']),
    };
    const [videoFilePath, audioFilePath] = await Promise.all([
        yt.$downloadFormat({...commonDownloadProps, ...formats.video}),
        yt.$downloadFormat({...commonDownloadProps, ...formats.audio}),
    ]);
    if (!videoFilePath || !audioFilePath) {
        logger.error('no videoFilePath or audioFilePath');

        return editMessageTextHTML('Не смог скачать. Можно еще раз ссылочку?');
    }
    logger.info({videoFilePath, audioFilePath});

    await editMessageTextHTML('Соединяю аудио и видео дорожки');

    const resolution = getResolution(formats.video);
    const storedFileName = [
        String(messageId),
        resolution,
        formats.video.format_id,
        formats.audio.format_id,
        'mp4',
    ].join('.');
    logger.info({storedFileName});

    const resultFilePath = await FFMPEG.$mergeAudioAndVideo(
        videoFilePath,
        audioFilePath,
        storedFileName,
    ).catch((e) => {
        logger.error('Merge Error', {videoFilePath, audioFilePath, storedFileName}, e);

        return null;
    });
    if (!resultFilePath) {
        logger.error('resultFilePath is null');

        return editMessageTextHTML(
            'Не смог соединить видео и аудио. Начинаем все с начала. Можно еще раз ссылочку?',
        );
    }
    logger.info({resultFilePath});

    await deleteFile(videoFilePath);
    await deleteFile(audioFilePath);

    const displayFileName = [
        filenamify(videoTitle, {replacement: '_'}),
        getResolution(formats.video),
        'mp4',
    ].join('.');
    logger.info({displayFileName});

    const uploadInS3 = async () => {
        await editMessageTextHTML('Загружаю в облако');

        try {
            const s3 = await S3.init(ctx.logger);
            const s3DownloadUrl = await s3.uploadUserFile(
                {path: resultFilePath, name: displayFileName},
                String(ctx.from.username || ctx.from.id),
            );
            if (!s3DownloadUrl) {
                logger.error('s3DownloadUrl is null');

                return editMessageTextHTML('Произошла ошибка при загрузке в облако');
            }
            logger.info({s3DownloadUrl});

            await editMessageTextHTML(
                `Готово! Скаченное видео доступно по ссылке:\n ${getLink(videoTitle, s3DownloadUrl)}`,
            );
        } catch (_e) {
            logger.error('failed to upload video to s3');
            await editMessageTextHTML('Произошла ошибка при загрузке в облако');
        }
    };

    const uploadInTg = async () => {
        try {
            await ctx.replyWithDocument(
                {source: resultFilePath},
                {reply_parameters: {message_id: messageId}, caption: displayFileName},
            );
            logger.info('video uploaded in tg');
        } catch (_e) {
            logger.warn('failed to upload video to tg');
            await editMessageTextHTML(
                'Произошла ошибка при загрузке этого видоса в телеграмм, возможно файл слишком большой',
            );

            return uploadInS3();
        }
    };

    const settings = await SettingsService.getSettings(ctx);
    await (settings.uploadInTg ? uploadInTg : uploadInS3)();

    MessageService.deleteMessage(ctx, messageId).catch((_e) => {
        logger.warn('failed to delete message', _e);
    });
    deleteFile(resultFilePath).catch((_e) => {
        logger.warn('failed to delete filed', _e);
    });
});
